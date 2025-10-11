import * as React from "react";
import type { ToastActionElement, ToastProps } from "../components/ui/toast";

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

type State = { toasts: ToasterToast[] };

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000;

const listeners = new Set<(state: State) => void>();
let memoryState: State = { toasts: [] };

function emit(){ for(const l of listeners) l(memoryState); }
function dispatch(action: Action){
  switch(action.type){
    case "ADD_TOAST":
      memoryState = { ...memoryState, toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT) };
      break;
    case "UPDATE_TOAST":
      memoryState = { ...memoryState, toasts: memoryState.toasts.map(t => t.id===action.toast.id ? { ...t, ...action.toast } : t) };
      break;
    case "DISMISS_TOAST": {
      const { toastId } = action;
      memoryState = { ...memoryState, toasts: memoryState.toasts.map(t => (toastId===undefined || t.id===toastId) ? { ...t, open:false } : t) };
      break;
    }
    case "REMOVE_TOAST": {
      const { toastId } = action;
      memoryState = { ...memoryState, toasts: toastId ? memoryState.toasts.filter(t => t.id!==toastId) : [] };
      break;
    }
  }
  emit();
}
const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
function addToast(toast: Omit<ToasterToast,"id">){
  const id = genId();
  dispatch({ type:"ADD_TOAST", toast:{ id, open: toast.open ?? true, ...toast } });
  return id;
}
function updateToast(toast: Partial<ToasterToast> & { id: string }){ dispatch({ type:"UPDATE_TOAST", toast }); }
function dismissToast(toastId?: string){
  dispatch({ type:"DISMISS_TOAST", toastId });
  window.setTimeout(() => dispatch({ type:"REMOVE_TOAST", toastId }), TOAST_REMOVE_DELAY);
}
function removeToast(toastId?: string){ dispatch({ type:"REMOVE_TOAST", toastId }); }

export function useToast(){
  const state = React.useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => memoryState,
    () => memoryState
  );
  const toast = React.useCallback((props: Omit<ToasterToast,"id">) => addToast(props), []);
  return { ...state, toast, dismiss: dismissToast, remove: removeToast, update: updateToast };
}
export const toast = (props: Omit<ToasterToast,"id">) => addToast(props);
export const dismiss = (toastId?: string) => dismissToast(toastId);
export const remove = (toastId?: string) => removeToast(toastId);
export const update = (toast: Partial<ToasterToast> & { id: string }) => updateToast(toast);
