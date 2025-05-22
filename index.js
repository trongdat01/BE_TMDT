import express from "express";
import routes from "./src/routes/index.js";
import connectDB from "./src/configs/db.js";
import notFoundHandler from "./src/middlewares/notFoundHandler.js";
import errorMessageHandler from "./src/middlewares/errorMessage.middleware.js";
import cors from "cors";
import { PORT } from "./src/configs/enviroments.js";
import jsonValid from "./src/middlewares/jsonInvalid.js";
import setupSwagger from "./src/configs/swaggerConfig.js";
import { successResponse, errorResponse } from "./src/middlewares/response.middleware.js";

const app = express();
app.use(express.json());

connectDB();

app.use(
	cors({
		origin: ["http://localhost:5173", "http://localhost:5174"],
		credentials: true,
	})
);

setupSwagger(app);

app.use("/api", routes);
app.use(successResponse); // Đặt sau routes để bắt req.data từ controller

app.use(jsonValid);
app.use(notFoundHandler);
app.use(errorMessageHandler); // Sử dụng middleware chuẩn hóa lỗi
app.use(errorResponse); // Chuẩn hóa response lỗi (nếu cần)

const server = app.listen(PORT, () => {
	console.log(`Server is running on: http://localhost:${PORT}/api`);
	console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});

process.on("unhandledRejection", (error, promise) => {
	console.error(`Error: ${error.message}`);
	server.close(() => process.exit(1));
});
