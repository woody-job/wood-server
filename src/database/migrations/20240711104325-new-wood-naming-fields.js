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

    await queryInterface.addColumn('wood_naming', 'minDiameter', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('wood_naming', 'maxDiameter', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('wood_naming', 'length', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('wood_naming', 'wood_type_id', {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    await queryInterface.addConstraint('wood_naming', {
      fields: ['wood_type_id'],
      type: 'foreign key',
      name: 'wood_naming_wood_type_id_fkey',
      references: {
        table: 'wood_type',
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
