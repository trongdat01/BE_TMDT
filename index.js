import express from "express";
import routes from "./src/routes/index.js";
import connectDB from "./src/configs/db.js";
import notFoundHandler from "./src/middlewares/notFoundHandler.js";
import errorMessageHandler from "./src/middlewares/errorMessage.middleware.js";
import cors from "cors";
import { PORT } from "./src/configs/enviroments.js";
import jsonValid from "./src/middlewares/jsonInvalid.js";
import setupSwagger from "./src/configs/swaggerConfig.js";
import { successResponse } from "./src/middlewares/response.middleware.js";

const app = express();
app.use(express.json());

connectDB();

// CORS Configuration - Cấu hình tối ưu cho development
app.use(
	cors({
		origin: function (origin, callback) {
			// Cho phép requests không có origin (mobile apps, postman, etc.)
			if (!origin) return callback(null, true);

			const allowedOrigins = [
				// Development servers
				"http://localhost:5173", // Vite
				"http://localhost:5174", // Vite backup
				"http://localhost:3000", // React/Next.js
				"http://localhost:3001", // React backup
				"http://localhost:8080", // Vue CLI
				"http://localhost:4200", // Angular

				// Alternative localhost addresses
				"http://127.0.0.1:5173",
				"http://127.0.0.1:3000",
				"http://127.0.0.1:8080",
				"http://127.0.0.1:4200",
			];

			if (allowedOrigins.includes(origin)) {
				console.log(`✅ CORS allowed: ${origin}`);
				callback(null, true);
			} else {
				console.log(`🚫 CORS blocked: ${origin}`);
				callback(new Error(`CORS: Origin ${origin} not allowed`));
			}
		},
		credentials: true, // Cho phép cookies và auth headers
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: [
			'Content-Type',
			'Authorization',
			'X-Requested-With',
			'Accept',
			'Origin',
			'X-API-Key'
		],
		exposedHeaders: ['Authorization'], // Headers được expose cho frontend
		maxAge: 86400, // Cache preflight response 24h
		optionsSuccessStatus: 200 // Support legacy browsers
	})
);

setupSwagger(app);

// Đặt middleware response trước routes để controllers có thể sử dụng res.success
app.use(successResponse);
app.use("/api", routes);

app.use(jsonValid);
app.use(notFoundHandler);
app.use(errorMessageHandler); // Middleware xử lý lỗi toàn diện

const server = app.listen(PORT, () => {
	console.log(`Server is running on: http://localhost:${PORT}/api`);
	console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});

process.on("unhandledRejection", (error, promise) => {
	console.error(`Error: ${error.message}`);
	server.close(() => process.exit(1));
});
