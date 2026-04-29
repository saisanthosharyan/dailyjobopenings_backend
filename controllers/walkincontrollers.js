const WalkInJob = require ("../models/WalkIn");
const slugify = require ("slugify");



/* ======================================================
   CREATE WALK-IN
====================================================== */

exports.createWalkIn = async (req, res) => {
  try {
    const {
      walkintitle,
      companyName,
      location,
      walkInDetails
    } = req.body;

    // Basic validation
    if (
      !walkintitle ||
      !companyName ||
      !location ||
      !walkInDetails?.startDate ||
      !walkInDetails?.endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }

    // Generate slug
    const baseSlug = slugify(walkintitle, {
      lower: true,
      strict: true
    });

    let walkinslug = baseSlug;

    // Handle duplicate slug
    const existingSlug = await WalkInJob.findOne({ walkinslug });

    if (existingSlug) {
      walkinslug = `${baseSlug}-${Date.now()}`;
    }

    // Duplicate detection
    const existingWalkIn = await WalkInJob.findOne({
      companyName: companyName.trim(),
      walkintitle: walkintitle.trim(),
      "walkInDetails.startDate": walkInDetails.startDate
    });

    if (existingWalkIn) {
      return res.status(409).json({
        success: false,
        message: "Walk-In already exists"
      });
    }

    // Create walk-in
    const walkIn = await WalkInJob.create({
      ...req.body,
      walkinslug
    });

    return res.status(201).json({
      success: true,
      message: "Walk-In created successfully",
      walkIn
    });

  } catch (error) {
    console.error("CREATE WALK-IN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create walk-in",
      error: error.message
    });
  }
};





/* ======================================================
   GET ALL WALK-INS
====================================================== */

exports.getAllWalkIns = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      location,
      companyName,
      roleCategory,
      batch,
      mode,
      featured
    } = req.query;

    const query = {
      isActive: true
    };



    /* =========================
       FILTERS
    ========================= */

    if (search) {
      query.$text = {
        $search: search
      };
    }

    if (location) {
      query.location = {
        $regex: location,
        $options: "i"
      };
    }

    if (companyName) {
      query.companyName = {
        $regex: companyName,
        $options: "i"
      };
    }

    if (roleCategory) {
      query.roleCategory = roleCategory;
    }

    if (batch) {
      query.batch = batch;
    }

    if (mode) {
      query.mode = mode;
    }

    if (featured === "true") {
      query.isFeatured = true;
    }



    /* =========================
       PAGINATION
    ========================= */

    const skip = (page - 1) * limit;



    /* =========================
       FETCH DATA
    ========================= */

    const [walkIns, totalWalkIns] = await Promise.all([
      WalkInJob.find(query)
        .sort({
          isFeatured: -1,
          "walkInDetails.startDate": -1,
          createdAt: -1
        })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      WalkInJob.countDocuments(query)
    ]);



    return res.status(200).json({
      success: true,
      totalWalkIns,
      currentPage: Number(page),
      totalPages: Math.ceil(totalWalkIns / limit),
      walkIns
    });

  } catch (error) {
    console.error("GET ALL WALK-INS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch walk-ins",
      error: error.message
    });
  }
};





/* ======================================================
   GET WALK-IN BY SLUG
====================================================== */

exports.getWalkInBySlug = async (req, res) => {
  try {
    const { walkinslug } = req.params;

    const walkIn = await WalkInJob.findOne({
      walkinslug,
      isActive: true
    }).lean();

    if (!walkIn) {
      return res.status(404).json({
        success: false,
        message: "Walk-In not found"
      });
    }

    // Increment views asynchronously
    WalkInJob.updateOne(
      { _id: walkIn._id },
      { $inc: { views: 1 } }
    ).catch(err => console.log(err));

    return res.status(200).json({
      success: true,
      walkIn
    });

  } catch (error) {
    console.error("GET WALK-IN BY SLUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch walk-in",
      error: error.message
    });
  }
};





/* ======================================================
   UPDATE WALK-IN
====================================================== */

exports.updateWalkIn = async (req, res) => {
  try {
    const { id } = req.params;

    const existingWalkIn = await WalkInJob.findById(id);

    if (!existingWalkIn) {
      return res.status(404).json({
        success: false,
        message: "Walk-In not found"
      });
    }

    // Regenerate slug if title changes
    if (
      req.body.walkintitle &&
      req.body.walkintitle !== existingWalkIn.walkintitle
    ) {
      const baseSlug = slugify(req.body.walkintitle, {
        lower: true,
        strict: true
      });

      let updatedSlug = baseSlug;

      const existingSlug = await WalkInJob.findOne({
        walkinslug: updatedSlug,
        _id: { $ne: id }
      });

      if (existingSlug) {
        updatedSlug = `${baseSlug}-${Date.now()}`;
      }

      req.body.walkinslug = updatedSlug;
    }

    const updatedWalkIn = await WalkInJob.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "Walk-In updated successfully",
      updatedWalkIn
    });

  } catch (error) {
    console.error("UPDATE WALK-IN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update walk-in",
      error: error.message
    });
  }
};





/* ======================================================
   DELETE WALK-IN
====================================================== */

exports.deleteWalkIn = async (req, res) => {
  try {
    const { id } = req.params;

    const walkIn = await WalkInJob.findById(id);

    if (!walkIn) {
      return res.status(404).json({
        success: false,
        message: "Walk-In not found"
      });
    }

    await WalkInJob.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Walk-In deleted successfully"
    });

  } catch (error) {
    console.error("DELETE WALK-IN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete walk-in",
      error: error.message
    });
  }
};