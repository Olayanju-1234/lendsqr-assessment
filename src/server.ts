import app from "./app";
import config from "./config";

const { PORT } = config;

app.listen(PORT, () => {
  console.log(`Demo Credit API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
