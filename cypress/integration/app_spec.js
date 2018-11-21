describe("Django REST framework / React quickstart app", () => {
    before(() => {
    });

    it("Test gen menu function", () => {
            cy.server();
            cy.route('ui/menu/**').as('getMenu');

        let win = cy.window();
        cy.visit("/");
        cy.wait('@getMenu').debug();
        }
    );
    it("should be able to fill a web form", () => {
        cy
            .get('.p-panelmenu.p-component').should('exist')
        // .debug();
    });

    // more tests here
});
