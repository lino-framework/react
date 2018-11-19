describe("Django REST framework / React quickstart app", () => {
  before(() => {
  });

  it("should be able to fill a web form", () => {
    cy.visit("/");
    cy
      .get('.p-panelmenu.p-component')
      .should("have.childElementCount", 2);
  });
  // more tests here
});
