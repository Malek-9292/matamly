import "dotenv/config";
import { initRestaurant } from "./restaurant-db";

initRestaurant().then(() => {
  console.log("Database schema is ready and existing JSON data was imported when present.");
  process.exit(0);
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
