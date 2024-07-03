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

    await queryInterface.addColumn('wood_arrival', 'car', {
      type: Sequelize.DataTypes.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('wood_arrival', 'supplier_id', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('wood_arrival', {
      fields: ['supplier_id'],
      type: 'foreign key',
      name: 'wood_arrival_supplier_id_fkey',
      references: {
        table: 'supplier',
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
