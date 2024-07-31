const Sequelize = require("sequelize");

var sequelize = new Sequelize("SenecaDB", "SenecaDB_owner", "CbU18tMyPgTL", {
  host: "ep-polished-glade-a5bbli2o.us-east-2.aws.neon.tech",
  dialect: "postgres",
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
  query: { raw: true },
});

const Item = sequelize.define("Item", {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  itemDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Item.belongsTo(Category, { foreignKey: "category" });

const initialize = () => {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve("Database synced successfully");
      })
      .catch((err) => {
        reject("Unable to sync the database: ", err);
      });
  });
};

const getAllItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll()
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        reject("Error retrieving items: ", err);
      });
  });
};

const getPublishedItems = () => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { published: true } })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        reject("Error retrieving published items: ", err);
      });
  });
};

const getCategories = () => {
  return new Promise((resolve, reject) => {
    Category.findAll()
      .then((categories) => {
        if (categories.length > 0) {
          resolve(categories);
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        reject("Error retrieving categories: ", err);
      });
  });
};

// Function to add a new item
const addItem = (itemData) => {
  return new Promise((resolve, reject) => {
    // Ensure itemData has correct properties
    itemData.published = itemData.published ? true : false;

    // Replace empty values with null
    for (let key in itemData) {
      if (itemData[key] === "") {
        itemData[key] = null;
      }
    }

    // Set itemDate to current date
    itemData.itemDate = new Date();

    Item.create(itemData)
      .then((item) => resolve(item))
      .catch((err) => {
        reject("Unable to create item: ", err);
      });
  });
};

// Function to get items by category
const getItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { category } })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        reject("Error retrieving items by category: ", err);
      });
  });
};

// Function to get published items by category
const getPublishedItemsByCategory = (category) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { published: true, category } })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        reject("Error retrieving published items by category: ", err);
      });
  });
};

// Function to get items by minimum date
const getItemsByMinDate = (minDateStr) => {
  const { Op } = Sequelize;
  return new Promise((resolve, reject) => {
    Item.findAll({
      where: {
        itemDate: {
          [Op.gte]: new Date(minDateStr),
        },
      },
    })
      .then((items) => {
        if (items.length > 0) {
          resolve(items);
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        reject("Error retrieving items by date: ", err);
      });
  });
};

// Function to get an item by ID
const getItemById = (id) => {
  return new Promise((resolve, reject) => {
    Item.findAll({ where: { id } })
      .then((items) => {
        if (items.length > 0) {
          resolve(items[0]); // Return the first item
        } else {
          reject("No results returned");
        }
      })
      .catch((err) => {
        reject("Error retrieving item by ID: ", err);
      });
  });
};

//Function to add Category
const addCatergory = (categoryData) => {
  return new Promise((resolve, reject) => {
    try {
      // Convert blank values to null
      Object.entries(categoryData).forEach(([key, value]) => {
        if (value === "") {
          categoryData[key] = null;
        }
      });

      // Attempt to create the category
      Category.create(categoryData)
        .then(() => resolve(categoryData))
        .catch((err) => reject("Unable to create category"));
    } catch (e) {
      reject("Unable to save category");
    }
  });
};

// Delete category by ID
const deleteCategoryById = (id) => {
  return new Promise((resolve, reject) => {
      Category.destroy({
          where: { id: id }
      })
      .then((deleted) => {
          if (deleted) {
              resolve();
          } else {
              reject("Category not found");
          }
      })
      .catch(() => {
          reject("Unable to remove category");
      });
  });
};

const deleteItemById = (id) => {
  return new Promise((resolve, reject) => {
      Item.destroy({
          where: { id: id }
      })
      .then((deleted) => {
          if (deleted) {
              resolve();
          } else {
              reject("Item not found");
          }
      })
      .catch(() => {
          reject("Unable to remove item");
      });
  });
};

module.exports = {
  Category,
  Item,
  initialize,
  getAllItems,
  getPublishedItems,
  getCategories,
  addItem,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  getPublishedItemsByCategory,
  addCatergory,
  deleteCategoryById,
  deleteItemById
};