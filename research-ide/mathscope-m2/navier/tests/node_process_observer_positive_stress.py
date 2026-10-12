"""Observe a subprocess through a host-mounted /proc in a PID namespace.

Use local Popen.pid for wait/kill. Use the discovered host PID only for /proc.
This module launches nothing and does not mutate an observed process.
"""
import os
from pathlib import Path
import re


def self_host_pid():
    return int(os.readlink('/proc/self'))


def proc_status_table():
    """One status scan also works when optional task/*/children is absent."""
    table={}
    for directory in Path('/proc').iterdir():
        if not directory.name.isdecimal():
            continue
        try:
            status=(directory/'status').read_text()
        except (FileNotFoundError,ProcessLookupError,PermissionError):
            continue
        def number(name):
            match=re.search(r'^'+name+r':\s+(\d+)',status,re.M)
            return int(match.group(1)) if match else None
        namespace=re.search(r'^NSpid:\s+([^\n]+)',status,re.M)
        table[int(directory.name)]={'parentHostPid':number('PPid'),
            'namespacePids':[int(value) for value in namespace.group(1).split()] if namespace else [],
            'rssBytes':number('VmRSS')*1024 if number('VmRSS') is not None else None,
            'highWaterBytes':number('VmHWM')*1024 if number('VmHWM') is not None else None}
    return table


def host_pid_for_local_child(local_pid,parent_host_pid=None,table=None):
    """Resolve a direct child's local PID using its actual NSpid record."""
    parent_host_pid=self_host_pid() if parent_host_pid is None else parent_host_pid
    table=proc_status_table() if table is None else table
    for host_pid,row in table.items():
        if row['parentHostPid']==parent_host_pid and row['namespacePids'] and row['namespacePids'][-1]==local_pid:
            return host_pid
    return None


class ProcessTreeObserver:
    def __init__(self,local_pid):
        self.local_pid=local_pid
        self.parent_host_pid=self_host_pid()
        self.root_host_pid=None
        self.tree_peak_bytes=0
        self.individual_high_water_bytes=0
        self.successful_samples=0
        self.maximum_process_count=0

    def sample(self):
        table=proc_status_table()
        if self.root_host_pid is None:
            self.root_host_pid=host_pid_for_local_child(self.local_pid,self.parent_host_pid,table)
        if self.root_host_pid is None:
            return {'rootResolved':False,'rssBytes':None,'processCount':0}
        children={}
        for host_pid,row in table.items():
            children.setdefault(row['parentHostPid'],[]).append(host_pid)
        pending=[self.root_host_pid];seen=set();total=0;rows=[]
        while pending:
            host_pid=pending.pop()
            if host_pid in seen:
                continue
            seen.add(host_pid)
            row=table.get(host_pid)
            if row is None:
                continue
            if row['rssBytes'] is not None:
                total+=row['rssBytes']
            if row['highWaterBytes'] is not None:
                self.individual_high_water_bytes=max(self.individual_high_water_bytes,row['highWaterBytes'])
            rows.append({'hostPid':host_pid,'rssBytes':row['rssBytes']})
            pending.extend(children.get(host_pid,[]))
        if rows:
            self.successful_samples+=1
            self.tree_peak_bytes=max(self.tree_peak_bytes,total)
            self.maximum_process_count=max(self.maximum_process_count,len(rows))
        return {'rootResolved':True,'rootHostPid':self.root_host_pid,'rssBytes':total if rows else None,
                'processCount':len(rows),'processes':rows}

    def receipt(self):
        return {'schema':'MathScope.NamespaceAwareProcessTreeMemory/1','localChildPid':self.local_pid,
                'observerHostPid':self.parent_host_pid,'rootHostPid':self.root_host_pid,
                'rootResolved':self.root_host_pid is not None,'successfulSamples':self.successful_samples,
                'maximumProcessCount':self.maximum_process_count,'observedTreePeakBytes':self.tree_peak_bytes or None,
                'observedIndividualHighWaterBytes':self.individual_high_water_bytes or None,
                'unresolvedIsZeroMemory':False,'killAndWaitUseLocalPID':True,
                'procMethod':'One /proc/*/status scan; host PPid tree and explicit NSpid mapping. No optional task/children file required.',
                'scope':'Observed live /proc samples of this child subtree; not the total workspace and not a continuous exact RSS maximum.'}
