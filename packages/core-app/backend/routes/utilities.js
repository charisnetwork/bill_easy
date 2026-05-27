const router = require("express").Router();

const utilController = require("../controllers/utilityController");

router.get("/pincode/:pincode", utilController.getPincode);

router.get("/gst/:gst", utilController.getGST);

module.exports = router;
