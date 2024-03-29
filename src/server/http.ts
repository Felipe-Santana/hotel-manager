import express, { Router, json } from 'express';
import { createServer } from 'https';
import { RoomController } from '../room/controllers/roomController.js';
import { Database } from '../room/repository/mongodb.js';
import { RoomRepository } from '../room/repository/room.js';
import { logger } from '../util/logger.js';
import { RoomRouter } from '../room/routes/room.js';
import { readFileSync } from 'fs';
import path from 'path';
import url from 'url';
import { FileRepository } from '../room/repository/file.js';
import { checkAuth } from './authMiddleware.js';
import session from 'express-session';
import config from 'config';
import helmet from 'helmet';
import { RoomActions } from '../room/actions/room.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export async function startHttpServer() {
	const app = express();
	app.disable('x-powered-by');
	app.use(json());
	app.use(helmet());
	app.use(session({
		secret: config.get('auth.session_secret'),
		saveUninitialized: true,
		resave: true
	}));
	app.use((req, _, next) => {
		logger.info(`METHOD: ${req.method} - PATH: ${req.url}`);
		next();
	});
	app.use(checkAuth);

	const baseRouter = Router();

	const database = await Database.getInstance(process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME, process.env.DB_HOST, Number(process.env.DB_PORT));
	if (!database) throw new Error('Unable to establish a connection with the database');
	const roomRepository = new RoomRepository(database, 'rooms');
	const fileRepository = new FileRepository(database, 'files');
	const roomActions = new RoomActions();
	const roomController = new RoomController(roomRepository, roomActions);
	const roomRouter = new RoomRouter(roomController, fileRepository);
	roomRouter.load(baseRouter);

	app.use('/v1', baseRouter);

	const options = {
		key: readFileSync(path.resolve(__dirname, '..', '..', 'certs', 'client-key.pem')),
		cert: readFileSync(path.resolve(__dirname, '..', '..', 'certs', 'client-cert.pem')),
		passphrase: process.env.CERT_PASSPHRASE
	};
	const httpsServer = createServer(options, app);
	const port = process.env.SERVER_PORT ?? 3000;

	httpsServer.listen(port, () => {
		logger.info(`Server started listening at https://localhost:${port}`);
	});
}
