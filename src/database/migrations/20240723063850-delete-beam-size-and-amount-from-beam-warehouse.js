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

    await queryInterface.removeColumn('beam_warehouse', 'amount');
    await queryInterface.removeColumn('beam_warehouse', 'beam_size_id');

    // await queryInterface.removeConstraint(
    //   'beam_warehouse',
    //   'beam_warehouse_beam_size_id_fkey',
    // );
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
