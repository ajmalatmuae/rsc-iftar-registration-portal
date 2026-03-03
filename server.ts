import app from "./src/server/app";

const PORT = 3000;

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const setupVite = async () => {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Vite setup failed:", e);
    }
  };
  setupVite();
  
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
