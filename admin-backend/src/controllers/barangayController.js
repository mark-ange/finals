const Barangay = require("../models/barangay");
const Incident = require("../models/Incident");

const defaultBarangays = [
  {
    name: "Carmen",
    district: "District 1",
  },
  {
    name: "Lapasan",
    district: "District 1",
  },
  {
    name: "Macasandig",
    district: "District 1",
  },
  {
    name: "Balulang",
    district: "District 2",
  },
  {
    name: "Lumbia",
    district: "District 3",
  },
  {
    name: "Bugo",
    district: "District 1",
  },
];

const normalizeText = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase();
};

const seedDefaultBarangays = async () => {
  for (const barangay of defaultBarangays) {
    const existingBarangay =
      await Barangay.findOne({
        name: {
          $regex: `^${barangay.name}$`,
          $options: "i",
        },
      });

    if (!existingBarangay) {
      await Barangay.create({
        name: barangay.name,
        district: barangay.district,
        status: "Active",
      });
    } else {
      const updates = {};

      if (!existingBarangay.district) {
        updates.district = barangay.district;
      }

      if (!existingBarangay.status) {
        updates.status = "Active";
      }

      if (Object.keys(updates).length > 0) {
        await Barangay.updateOne(
          { _id: existingBarangay._id },
          {
            $set: updates,
          }
        );
      }
    }
  }
};

const getIncidentDate = (incident) => {
  return (
    incident.updatedAt ||
    incident.createdAt ||
    incident.date ||
    null
  );
};

const getBarangays = async (req, res) => {
  try {
    await seedDefaultBarangays();

    const barangays =
      await Barangay.find().sort({
        name: 1,
      });

    const incidents =
      await Incident.find();

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const data = barangays.map(
      (barangay) => {
        const barangayName =
          barangay.name ||
          "Unknown Barangay";

        const barangayNameNormalized =
          normalizeText(barangayName);

        const barangayIncidents =
          incidents.filter(
            (incident) => {
              const incidentBarangay =
                normalizeText(
                  incident.barangay
                );

              if (
                !incidentBarangay ||
                !barangayNameNormalized
              ) {
                return false;
              }

              return (
                incidentBarangay ===
                barangayNameNormalized
              );
            }
          );

        const activeIncidents =
          barangayIncidents.filter(
            (incident) =>
              [
                "Pending",
                "Assigned",
                "In Progress",
              ].includes(
                incident.status
              )
          );

        const resolvedIncidents =
          barangayIncidents.filter(
            (incident) =>
              incident.status ===
              "Resolved"
          );

        const resolvedThisMonth =
          resolvedIncidents.filter(
            (incident) => {
              const incidentDate =
                getIncidentDate(
                  incident
                );

              if (!incidentDate) {
                return false;
              }

              return (
                new Date(
                  incidentDate
                ) >= startOfMonth
              );
            }
          );

        const teams = [
          ...new Set(
            barangayIncidents
              .map(
                (incident) =>
                  incident.team
              )
              .filter(
                (team) =>
                  team !== null &&
                  team !== undefined &&
                  String(team).trim() !== ""
              )
          ),
        ];

        const recentActivity = {};

        barangayIncidents
          .sort((a, b) => {
            const dateA =
              getIncidentDate(a);

            const dateB =
              getIncidentDate(b);

            return (
              new Date(dateB || 0) -
              new Date(dateA || 0)
            );
          })
          .slice(0, 5)
          .forEach((incident) => {
            const ticketNumber =
              incident.ticketNumber;

            if (!ticketNumber) {
              return;
            }

            recentActivity[
              ticketNumber
            ] = {
              status:
                incident.status ||
                "Pending",

              category:
                incident.category ||
                "",

              updatedAt:
                getIncidentDate(
                  incident
                ),
            };
          });

        return {
          id: barangay._id,

          name:
            barangay.name ||
            "Unknown Barangay",

          district:
            barangay.district ||
            "District 1",

          status:
            barangay.status ||
            "Active",

          location:
            barangay.location ||
            "",

          captain:
            barangay.captain ||
            "",

          contact:
            barangay.contact ||
            "",

          population:
            barangay.population ||
            0,

          active:
            activeIncidents.length,

          resolved:
            resolvedIncidents.length,

          resolvedThisMonth:
            resolvedThisMonth.length,

          total:
            barangayIncidents.length,

          teams:
            teams.length,

          recentActivity,
        };
      }
    );

    const totalActive =
      data.reduce(
        (sum, barangay) =>
          sum + barangay.active,
        0
      );

    const totalResolvedThisMonth =
      data.reduce(
        (sum, barangay) =>
          sum +
          barangay.resolvedThisMonth,
        0
      );

    res.json({
      success: true,

      count: data.length,

      summary: {
        totalBarangays:
          data.length,

        activeIncidents:
          totalActive,

        resolvedThisMonth:
          totalResolvedThisMonth,
      },

      data,
    });
  } catch (error) {
    console.error(
      "Get barangays error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to fetch barangays",

      error: error.message,
    });
  }
};

const createBarangay = async (
  req,
  res
) => {
  try {
    const {
      name,
      district,
      location,
      captain,
      contact,
      population,
    } = req.body;

    if (!name || !district) {
      return res.status(400).json({
        success: false,

        message:
          "Barangay name and district are required",
      });
    }

    const cleanName =
      String(name).trim();

    const existingBarangay =
      await Barangay.findOne({
        name: {
          $regex: `^${cleanName}$`,
          $options: "i",
        },
      });

    if (existingBarangay) {
      return res.status(409).json({
        success: false,

        message:
          "Barangay already exists",
      });
    }

    const barangay =
      await Barangay.create({
        name: cleanName,

        district,

        status: "Active",

        location:
          location || "",

        captain:
          captain || "",

        contact:
          contact || "",

        population:
          Number(population) || 0,
      });

    res.status(201).json({
      success: true,

      message:
        "Barangay created successfully",

      data: barangay,
    });
  } catch (error) {
    console.error(
      "Create barangay error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,

        message:
          "Barangay already exists",
      });
    }

    res.status(500).json({
      success: false,

      message:
        "Failed to create barangay",

      error: error.message,
    });
  }
};

module.exports = {
  getBarangays,
  createBarangay,
};