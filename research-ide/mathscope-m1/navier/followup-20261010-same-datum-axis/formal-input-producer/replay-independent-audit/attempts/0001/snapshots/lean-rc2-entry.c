/* Explicit Lean frontend embedding for an environment where CLI app-path
   autodetection is unavailable. The official shared library is unchanged. */
#include <lean/lean.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <getopt.h>

extern void lean_initialize_runtime_module(void);
extern void lean_initialize(void);
extern lean_object *initialize_Lean(uint8_t builtin);
extern lean_object *l_Lean_initSearchPath(lean_object *sysroot, lean_object *sp);
extern void lean_enable_initializer_execution(void);
extern lean_object *lean_shell_options_mk(lean_object *unit);
extern lean_object *lean_shell_main(lean_object *args, lean_object *opts);
extern lean_object *lean_shell_options_process(lean_object *opts, uint32_t opt, lean_object *arg);

static struct option options[] = {
  {"version",no_argument,0,'v'}, {"githash",no_argument,0,'g'},
  {"short-version",no_argument,0,'V'}, {"run",no_argument,0,'r'},
  {"root",required_argument,0,'R'}, {"setup",required_argument,0,'u'},
  {"json",no_argument,0,'J'}, {"timeout",required_argument,0,'T'},
  {"quiet",no_argument,0,'q'}, {"help",no_argument,0,'h'},
  {0,0,0,0}
};

static int consume_ok(lean_object *result) {
  if (lean_io_result_is_error(result)) {
    lean_io_result_show_error(result);
    lean_dec(result);
    return 0;
  }
  lean_dec(result);
  return 1;
}

int main(int argc, char **argv) {
  if (argc < 3) { fprintf(stderr, "Usage: lean-embed-check LEAN_SYSROOT [OPTIONS] FILE.lean\n"); return 2; }
  /* These two metadata options report the caller's explicit installation root. */
  if (argc == 3 && strcmp(argv[2], "--print-prefix") == 0) { puts(argv[1]); return 0; }
  if (argc == 3 && strcmp(argv[2], "--print-libdir") == 0) { printf("%s/lib/lean\n", argv[1]); return 0; }
  lean_initialize();
  if (!consume_ok(l_Lean_initSearchPath(lean_mk_string(argv[1]), lean_box(0)))) return 2;
  lean_enable_initializer_execution();
  lean_object *opts = lean_shell_options_mk(lean_box(0));
  int argumentCount = argc - 1;
  char **arguments = argv + 1;
  for (;;) {
    int option = getopt_long(argumentCount, arguments, "D:o:i:c:qgvVhrR:T:", options, NULL);
    if (option == -1) break;
    lean_object *argument = lean_box(0);
    if (optarg) {
      argument = lean_alloc_ctor(1, 1, 0);
      lean_ctor_set(argument, 0, lean_mk_string(optarg));
    }
    lean_object *parsed = lean_shell_options_process(opts, (uint32_t)option, argument);
    if (lean_io_result_is_error(parsed)) {
      int code = (int)lean_unbox(lean_io_result_get_error(parsed));
      lean_dec(parsed);
      return code;
    }
    opts = lean_io_result_take_value(parsed);
    if (option == 'r') break;
  }
  lean_io_mark_end_initialization();
  lean_init_task_manager_using(1);
  lean_object *args = lean_box(0);
  for (int index = argumentCount - 1; index >= optind; index--) {
    lean_object *cons = lean_alloc_ctor(1, 2, 0);
    lean_ctor_set(cons, 0, lean_mk_string(arguments[index]));
    lean_ctor_set(cons, 1, args);
    args = cons;
  }
  lean_object *result = lean_shell_main(args, opts);
  int status;
  if (lean_io_result_is_error(result)) {
    lean_io_result_show_error(result);
    status = 2;
  } else {
    status = (int)lean_unbox(lean_io_result_get_value(result));
  }
  lean_dec(result);
  lean_finalize_task_manager();
  return status;
}
