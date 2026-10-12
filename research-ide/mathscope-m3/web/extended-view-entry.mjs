import {validateExtendedView,deriveExtendedViewContract,deriveExtendedScene} from './extended-view-contract.mjs';
import {buildGaugeStudyPanels} from './gauge-study-view.mjs';
globalThis.MathScopeM3ViewContract=Object.freeze({validate:validateExtendedView,derive:deriveExtendedViewContract,scene:deriveExtendedScene});
globalThis.MathScopeM3GaugeStudyView=Object.freeze({panels:buildGaugeStudyPanels});
