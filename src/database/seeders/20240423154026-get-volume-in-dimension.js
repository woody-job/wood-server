'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
     */
    // const [dimensions, metadata] = await queryInterface.sequelize.query(
    //   'SELECT * FROM dimension',
    // );
    // dimensions.forEach(async (dimension) => {
    //   // console.log(
    //   //   `\n Running a query: ${dimension.id} ${dimension.width} ${dimension.thickness} ${dimension.length}
    //   //   ${(dimension.width / 1000) * (dimension.thickness / 1000) * dimension.length} \n`,
    //   // );
    //   await queryInterface.sequelize.query(
    //     `UPDATE dimension
    //       SET volume = ${(dimension.width / 1000) * (dimension.thickness / 1000) * dimension.length}
    //       WHERE id = ${dimension.id}
    //       `,
    //   );
    //   console.log('QUERY DONE: ', dimensionId);
    // });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  },
};
