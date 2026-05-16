import express from 'express';
import simulationStatus from './simulation-status';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json());

app.use('/simulation', simulationStatus);

app.listen(PORT, () => {
  console.log(`[Server] Rodando na porta ${PORT}`);
});

export default app;
