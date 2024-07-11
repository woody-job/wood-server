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

    await queryInterface.addColumn('wood_shipment', 'dimension_for_sale_id', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('wood_shipment', {
      fields: ['dimension_for_sale_id'],
      type: 'foreign key',
      name: 'wood_shipment_dimension_for_sale_id_fkey',
      references: {
        table: 'dimension',
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
