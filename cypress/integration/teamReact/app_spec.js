describe("Basic tests for TeamReact", () => {
    before(() => {
        cy.server();
        cy.route('**/api/**').as('getData');
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

    it("Should be possible to log in again and navigate around ", () => {
        cy.server();
        cy.route('**/api/**').as('getData');
        cy.visit('/');
        cy.get('.username').click();
        cy.get(".profile-expanded > li > a > span").click();
        cy.get("#signin-username").type("robin");
        cy.get("#signin-password").type("1234");
        cy.get(":nth-child(1) > .p-button-text").click();
        // logged in
        cy.get('[style="margin:5px"] > :nth-child(1) > :nth-child(4)').click(); // goto allTickets via html
        cy.wait(200); // wait to load...
        cy.get('.p-datatable-tbody > :nth-child(1)').click();
        cy.wait(200); // wait to load...
        cy.get('.l-nav-last > .pi').click();
        cy.wait(200); // wait to load...
        cy.get('.l-nav-first > .pi').click();
        cy.wait(200); // wait to load...
        cy.get('.l-nav-prev > .pi').click();
        cy.wait(200); // wait to load...
        cy.get('.l-nav-next > .pi').click();

        cy.get('.l-button-fk:first').click(); // opens Site
        cy.wait(500);
        cy.get(":nth-child(1) > :nth-child(2) > :nth-child(2) > div > a").click()
        cy.wait(200); // wait to load...
        cy.get('.layout-home-button').click();

        cy.get(".layout-menu-button > .pi").click(); // open menu

        cy.get(".layout-main-menu > :nth-child(4) > :nth-child(2)").click();
        cy.get(".active-menuitem > ul > :nth-child(3) > a").click();

        cy.get('.p-paginator-pages > :nth-child(2)').click();
        cy.wait(200); // wait to load...
        cy.get('.p-paginator-prev').click();
        cy.wait(200); // wait to load...
        cy.get('.p-paginator-next').click();
        cy.wait(200); // wait to load...

        cy.get('.l-button-fk:first').click(); // opens Site again
        cy.wait(200);
        cy.get('.layout-home-button').click();

        cy.get(".layout-menu-button > .pi").click(); // open menu
        cy.get(".layout-main-menu > :last ").click();
        cy.get(".active-menuitem > ul > :last > a").click();

        cy.get('h1').contains("About");
    });


    // more tests here
});
