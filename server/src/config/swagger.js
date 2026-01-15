import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hotel Management System API",
      version: "1.0.0",
      description:
        "Comprehensive REST API for hotel management operations including rooms, bookings, guests, rates, deals, and user management.",
      tags: [
        { name: "Authentication", description: "User authentication and authorization endpoints" },
        { name: "Users", description: "User management endpoints" },
        { name: "Rooms", description: "Room management endpoints" },
        { name: "Bookings", description: "Booking management endpoints" },
        { name: "Guests", description: "Guest management endpoints" },
        { name: "Rates", description: "Rate and pricing management endpoints" },
        { name: "Deals", description: "Deal and promotion management endpoints" },
        { name: "Contact", description: "Contact message endpoints" },
      ],
      contact: {
        name: "API Support",
        email: "support@hotelmanagement.com",
      },
      license: {
        name: "ISC",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
      {
        url: "https://your-domain.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "refreshToken",
          description: "Refresh token stored in HTTP-only cookie",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "integer" },
            username: { type: "string" },
            role: { type: "string", enum: ["USER", "MANAGER", "ADMIN"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Room: {
          type: "object",
          properties: {
            id: { type: "integer" },
            roomNumber: { type: "string" },
            floor: { type: "string" },
            type: {
              type: "string",
              enum: ["SINGLE", "DOUBLE", "DELUXE", "SUITE"],
            },
            price: { type: "string", format: "decimal" },
            capacity: { type: "integer" },
            description: { type: "string" },
            imageUrl: { type: "string" },
            cleanStatus: {
              type: "string",
              enum: ["CLEAN", "DIRTY", "IN_PROGRESS"],
            },
            bookingStatus: {
              type: "string",
              enum: ["AVAILABLE", "OCCUPIED"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "integer" },
            userId: { type: "integer" },
            roomId: { type: "integer" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            status: {
              type: "string",
              enum: ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"],
            },
            customerFirstName: { type: "string" },
            customerLastName: { type: "string" },
            customerEmail: { type: "string", format: "email" },
            paymentType: {
              type: "string",
              enum: ["CARD", "CASH", "PAYPAL"],
            },
            paymentStatus: {
              type: "string",
              enum: ["PENDING", "PAID", "FAILED"],
            },
            baseRate: { type: "string", format: "decimal" },
            finalPrice: { type: "string", format: "decimal" },
            dealId: { type: "integer", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Guest: {
          type: "object",
          properties: {
            id: { type: "integer" },
            fullName: { type: "string" },
            email: { type: "string", format: "email" },
            bookingId: { type: "integer" },
            roomId: { type: "integer", nullable: true },
            status: { type: "string" },
            paymentStatus: {
              type: "string",
              enum: ["PENDING", "PAID", "FAILED"],
            },
            finalPrice: { type: "string", format: "decimal" },
            dealId: { type: "integer", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Rate: {
          type: "object",
          properties: {
            id: { type: "integer" },
            roomId: { type: "integer" },
            policy: {
              type: "string",
              enum: ["STRICT", "FLEXIBLE", "NON_REFUNDABLE"],
            },
            rate: { type: "string", format: "decimal" },
            dealPrice: { type: "string", format: "decimal", nullable: true },
            dealId: { type: "integer", nullable: true },
            availableRooms: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Deal: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            discount: { type: "integer" },
            status: {
              type: "string",
              enum: ["ONGOING", "FULL", "INACTIVE"],
            },
            endDate: { type: "string", format: "date", nullable: true },
            roomType: {
              type: "string",
              enum: ["SINGLE", "DOUBLE", "SUITE", "DELUXE", "ALL"],
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Contact: {
          type: "object",
          properties: {
            id: { type: "integer" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            message: { type: "string" },
            read: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  msg: { type: "string" },
                  param: { type: "string" },
                  location: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    join(__dirname, "../routes/*.js"),
    join(__dirname, "../server.js"),
  ],
};

let swaggerSpec;
try {
  swaggerSpec = swaggerJsdoc(options);
  console.log("✅ Swagger spec generated successfully");
} catch (error) {
  console.error("❌ Error generating Swagger spec:", error);
  // Return a minimal spec if generation fails
  swaggerSpec = {
    openapi: "3.0.0",
    info: {
      title: "Hotel Management System API",
      version: "1.0.0",
      description: "API documentation is being generated...",
    },
    paths: {},
  };
}

export { swaggerSpec };
