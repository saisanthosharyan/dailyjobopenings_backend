const bcrypt = require("bcryptjs");

const hashPassword = async () => {
  const password = "Bunty@244"; // your login password
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  console.log("Hashed Password:", hashed);
};

hashPassword();