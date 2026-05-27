module.exports = (sequelize, DataTypes) => {

  const InvoiceCounter = sequelize.define('InvoiceCounter', {

    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },

    company_id: {
      type: DataTypes.UUID,
      allowNull: false
    },

    last_number: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }

  });

  return InvoiceCounter;
};
