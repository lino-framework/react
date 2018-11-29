describe("Basic tests for TeamReact", () => {
    before(() => {
       // cy.server();
       // cy.route('user/settings/').as('getUserSettings');
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
        // Open first menu item

        cy.get('.layout-main-menu > :nth-child(1) > :nth-child(2)').click();
        // cy.wait(2000);
        // For some reason I can't pinpoint the height of the side-menu gets messed up on this portion
        // Only happens in test env, not going to dig too deep rn.
        cy.get(".active-menuitem > ul > li > a > span").click();
        // cy.wait(400);
        cy.get(".layout-menu-button > .pi").click();
        cy.get(".layout-mask").click();
        cy.get(".layout-menu-button > .pi").click();

    });

    it("Should be possible to login and out", () => {
        cy.visit('/');
        cy.get('.username').click();
        cy.get(".profile-expanded > li > a > span").click();
        cy.get("#signin-username").type("robin");
        cy.get("#signin-password").type("1234");
        cy.get(":nth-child(1) > .p-button-text").click();
        // logged in
        cy.wait(200);
        cy.get(".layout-menu-button > .pi").click();
        cy.get(".profile-expanded > li > a > span").click();
        // logged out
        
        // cy.wait('@getUserSettings');
    });

    // more tests here
});
