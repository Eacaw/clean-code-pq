import React from "react";

interface RequiredLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
}

export default function RequiredLabel({
  children,
  required,
  ...props
}: RequiredLabelProps) {
  return (
    <label
      {...props}
      className={`block text-sm font-medium mb-1 ${props.className ?? ""}`}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}
