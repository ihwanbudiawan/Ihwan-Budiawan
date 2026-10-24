import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllBatches,
  saveBatch,
  deleteBatch,
  bulkDeleteBatches,
  getAllEvaluations,
  saveEvaluation,
  getMaintenance,
  saveMaintenance,
  deleteMaintenance,
} from './src/server/databaseService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API ROUTE: Database Batches
  app.get('/api/database/batches', (_req, res) => {
    try {
      const batches = getAllBatches();
      res.json({ success: true, data: batches });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/database/batches', (req, res) => {
    try {
      const saved = saveBatch(req.body);
      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/database/batches/:id', (req, res) => {
    try {
      const deleted = deleteBatch(req.params.id);
      res.json({ success: deleted });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/database/batches/bulk-delete', (req, res) => {
    try {
      const ids: string[] = req.body.ids || [];
      const deletedCount = bulkDeleteBatches(ids);
      res.json({ success: true, deletedCount });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API ROUTE: Database Continuous Evaluations
  app.get('/api/database/evaluations', (_req, res) => {
    try {
      const evals = getAllEvaluations();
      res.json({ success: true, data: evals });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/database/evaluations', (req, res) => {
    try {
      const saved = saveEvaluation(req.body);
      res.json({ success: true, data: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'AMR PowerEye PLN UP3 Kudus Server', timestamp: new Date().toISOString() });
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚡ AMR PowerEye PLN UP3 Kudus server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
