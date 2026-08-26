function BodyContainer({ children }) {
  return (
    <div className="flex-1 min-h-0 h-full flex flex-col bg-[var(--bg-color)] p-3 overflow-hidden">
      {children}
    </div>
  );
}

export default BodyContainer;
