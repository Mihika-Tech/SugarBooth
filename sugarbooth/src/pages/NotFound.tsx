const NotFound = () => {
  return (
    <div className="center" style={{ minHeight: "100vh", padding: 24 }}>
      <div className="stack card" style={{ padding: 24, width: 420, textAlign: "center" }}>
        <h1>404</h1>
        <p className="muted">Oops! Page not found</p>
        <a href="/" className="btn btn--outline" style={{ justifyContent: "center" }}>
          Return to Home
        </a>
      </div>
    </div>
  );
};
export default NotFound;
