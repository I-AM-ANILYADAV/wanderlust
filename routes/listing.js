const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");

// Middleware to validate listings
const validateListing = (req, res, next) => {
    const { error } = listingSchema.validate(req.body);
    if (error) {
        const errMsg = error.details.map((el) => el.message).join(",");
        return next(new ExpressError(errMsg, 400));
    }
    next();
};

// Display all listings
router.get("/", wrapAsync(async (req, res) => {
    const listings = await Listing.find({}).populate("owner");
    res.render("listings/index", { allListings: listings });
}));

// New Route
router.get("/new", isLoggedIn, wrapAsync((req, res) => {
    res.render("listings/new");
}));

// Show Route
router.get("/:id", wrapAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id)
        .populate("reviews")
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    }
    console.log(listing);
    res.render("listings/show", { listing });
}));

// Create Route
router.post("/", isLoggedIn, validateListing, wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    console.log(req.user);
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
}));

// Edit Route
router.get("/:id/edit", isLoggedIn, wrapAsync(async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/edit", { listing });
}));

// Update Route
router.put("/:id", isLoggedIn, validateListing, wrapAsync(async (req, res, next) => {
    const listing = await Listing.findByIdAndUpdate(req.params.id, { ...req.body.listing }, { new: true });
    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        res.redirect("/listings");
    }
    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${req.params.id}`);
}));

// Delete a specific listing by ID
router.delete("/:id", isLoggedIn, wrapAsync(async (req, res, next) => {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    }
    req.flash("success", "Listing Deleted Successfully!");
    res.redirect("/listings");
}));

module.exports = router;
