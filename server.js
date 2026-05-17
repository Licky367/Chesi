const express = require("express");
const http = require("http");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const session = require("express-session");
const { Server } = require("socket.io");
require("dotenv").config();
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

// ======================
// DATABASE
// ======================
const connectDB = require("./db");

// ======================
// ROUTES
// ======================
let createRoutes;
try { createRoutes = require("./routes/create"); } catch (err) { console.warn("Warning: failed to load create routes:", err.message); }
let authRoutes;
try { authRoutes = require("./routes/auth"); } catch (err) { console.warn("Warning: failed to load auth routes:", err.message); }
let updateRoutes;
try { updateRoutes = require("./routes/update"); } catch (err) { console.warn("Warning: failed to load update routes:", err.message); }
let milkRoutes;
try { milkRoutes = require("./routes/milk"); } catch (err) { console.warn("Warning: failed to load milk routes:", err.message); }
let newRoutes;
try { newRoutes = require("./routes/new"); } catch (err) { console.warn("Warning: failed to load new routes:", err.message); }
let financialsRoutes;
try { financialsRoutes = require("./routes/financials"); } catch (err) { console.warn("Warning: failed to load financials routes:", err.message); }
let indexRoutes;
try { indexRoutes = require("./routes/index"); } catch (err) { console.warn("Warning: failed to load index routes:", err.message); }
let profileRoutes;
try { profileRoutes = require("./routes/profile"); } catch (err) { console.warn("Warning: failed to load profile routes:", err.message); }
let accountsRoutes;
try { accountsRoutes = require("./routes/accounts"); } catch (err) { console.warn("Warning: failed to load accounts routes:", err.message); }

/*______POULTRY_____*/
let poultryStatsRoutes;
try { poultryStatsRoutes = require("./routes/poultryStats"); } catch (err) { console.warn("Warning: failed to load poultryStats routes:", err.message); }
let eggRoutes;
try { eggRoutes = require("./routes/poultryEgg"); } catch (err) { console.warn("Warning: failed to load poultryEgg routes:", err.message); }
let cageRoutes;
try { cageRoutes = require("./routes/poultryCage"); } catch (err) { console.warn("Warning: failed to load poultryCage routes:", err.message); }
let nursingRoutes;
try { nursingRoutes = require("./routes/poultryNursing"); } catch (err) { console.warn("Warning: failed to load poultryNursing routes:", err.message); }
let financeRoutes;
try { financeRoutes = require("./routes/poultryFinance"); } catch (err) { console.warn("Warning: failed to load poultryFinance routes:", err.message); }
let incubationRoutes;
try { incubationRoutes = require("./routes/poultryIncubation"); } catch (err) { console.warn("Warning: failed to load poultryIncubation routes:", err.message); }
let dashboardRoutes;
try { dashboardRoutes = require("./routes/dashboard"); } catch (err) { console.warn("Warning: failed to load dashboard routes:", err.message); }

/*________AGRICULTURE_______*/
let farmRoutes;
try { farmRoutes = require("./routes/farm"); } catch (err) { console.warn("Warning: failed to load farm routes:", err.message); }

// ======================
// SOCKET HANDLER
// ======================
const socketHandler = require("./socket/socket");

// ======================
// SEED ADMIN
// ======================
const seedAdmin = require("./utils/seedAdmin");

// ======================
// INIT APP + SERVER
// ======================
const app = express();
const server = http.createServer(app);

// enable trust proxy for proper secure cookies and client IPs behind proxies
app.enable("trust proxy");

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.MORGAN_FORMAT || "combined"));

// ======================
// SOCKET.IO SETUP
// ======================
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

socketHandler(io);

// ======================
// CONNECT DATABASE
// ======================
connectDB().then(async () => {
  await seedAdmin();
});

// ======================
// MIDDLEWARE
// ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ======================
// SESSION CONFIG
// ======================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24, // 1 Day
    },
  })
);

// ======================
// GLOBAL USER (EJS)
// ======================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// ======================
// STATIC FILES
// ======================
app.use(express.static(path.join(__dirname, "public")));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "public/uploads"))
);

// ======================
// VIEW ENGINE
// ======================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(expressLayouts);
app.set("layout", "layout");

// ======================
// ROUTES
// ======================
if (indexRoutes) app.use("/", indexRoutes);

if (createRoutes) app.use("/create-invite", createRoutes);

if (authRoutes) app.use("/", authRoutes);

if (updateRoutes) app.use("/", updateRoutes);

if (profileRoutes) app.use("/", profileRoutes);

if (milkRoutes) app.use("/", milkRoutes);

if (accountsRoutes) app.use("/accounts", accountsRoutes);

if (financialsRoutes) app.use("/financials", financialsRoutes);

if (newRoutes) app.use("/dairy", newRoutes);

/*______POULTRY_____*/
if (poultryStatsRoutes) app.use("/poultry-stats", poultryStatsRoutes);

if (eggRoutes) app.use("/eggs", eggRoutes);

if (cageRoutes) app.use("/cage", cageRoutes);

if (nursingRoutes) app.use("/nursing", nursingRoutes);

if (incubationRoutes) app.use("/incubation", incubationRoutes);

if (financeRoutes) app.use("/finance", financeRoutes);

if (dashboardRoutes) app.use("/dashboard", dashboardRoutes);

/*________AGRICULTURE_______*/
if (farmRoutes) app.use("/farm", farmRoutes);

// ======================
// 404 HANDLER
// ======================
app.use((req, res) => {
  res.status(404).render("index", {
    user: null,
  });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});