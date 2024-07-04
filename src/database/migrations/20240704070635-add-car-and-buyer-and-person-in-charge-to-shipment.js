'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.renameTable('person-in-charge', 'person_in_charge');

    await queryInterface.addColumn('wood_shipment', 'car', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('wood_shipment', 'buyer_id', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('wood_shipment', {
      fields: ['buyer_id'],
      type: 'foreign key',
      name: 'wood_shipment_buyer_id_fkey',
      references: {
        table: 'buyer',
        field: 'id',
      },
    });

    await queryInterface.addColumn('wood_shipment', 'person_in_charge_id', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('wood_shipment', {
      fields: ['person_in_charge_id'],
      type: 'foreign key',
      name: 'wood_shipment_person_in_charge_id_fkey',
      references: {
        table: 'person_in_charge',
        field: 'id',
      },
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
