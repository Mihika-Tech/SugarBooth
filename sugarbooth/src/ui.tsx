import type { ButtonHTMLAttributes, HTMLAttributes, SelectHTMLAttributes, PropsWithChildren } from "react";
import "./styles/global.css";

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["card", props.className].filter(Boolean).join(" ")} />;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" };
export function Button({ variant="primary", className, ...rest }: BtnProps) {
  return <button {...rest} className={["btn", `btn--${variant}`, className].filter(Boolean).join(" ")} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={["select", props.className].filter(Boolean).join(" ")} />;
}

export function Toolbar(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["toolbar", props.className].filter(Boolean).join(" ")} />;
}

export function Modal({
  open, onClose, children, className, ...rest
}: PropsWithChildren<{ open: boolean; onClose: () => void; } & HTMLAttributes<HTMLDivElement>>) {
  if (!open) return null;
  return (
    <div className="backdrop" onClick={onClose}>
      <div className={["modal", className].filter(Boolean).join(" ")} onClick={(e)=>e.stopPropagation()} {...rest}>
        {children}
      </div>
    </div>
  );
}