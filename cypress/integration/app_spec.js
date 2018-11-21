describe("Basic tests for TeamReact", () => {
    before(() => {
    });

//    it("Test gen menu function", () => {
//        cy.server();
//        cy.route('ui/menu/**').as('getMenu');
//        let win = cy.window();
//        cy.wait('@getMenu').debug();
//        }
//    );
    it("Should be possible to click on menu items and close menu", () => {
        cy.visit("/");
        cy.get('.p-panelmenu.p-component').should('exist');
        // Open first menu item
        cy.get(':nth-child(1) > .p-component > .p-panelmenu-header-link').click();
        cy.get(":nth-child(1) > .p-panelmenu-content-wrapper > .p-panelmenu-content >" +
                ".p-submenu-list > .p-menuitem > .p-menuitem-link").click();
        cy.get(".p-sidebar-close > .pi").click();
    });

    // more tests here
});
