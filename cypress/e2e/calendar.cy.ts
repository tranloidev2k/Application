const createEvent = (title: string) => {
  cy.contains("+ Add event").click();
  cy.get('[role="dialog"]').should("contain.text", "Create event");
  cy.get("input").first().type(title);
  cy.contains("button", "Save").click();
  cy.contains(title).should("exist");
};

describe("Time Blocking Calendar", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("creates an event and opens its detail dialog", () => {
    cy.contains("Time Blocking Calendar").should("be.visible");
    cy.contains("+ Add event").click();

    cy.get('[role="dialog"]').should("contain.text", "Create event");
    cy.get("input").first().type("Cypress planning");
    cy.contains("button", "Save").click();

    cy.contains("Cypress planning").should("exist").click({ force: true });
    cy.get('[role="dialog"]').should("contain.text", "Cypress planning");
  });

  it("validates the title and opens the event context menu", () => {
    cy.contains("+ Add event").click();
    cy.contains("button", "Save").click();
    cy.get('[role="alert"]').should("contain.text", "Please enter a title.");

    cy.get("input").first().type("Cypress menu event");
    cy.contains("button", "Save").click();
    cy.contains("Cypress menu event").rightclick({ force: true });

    cy.get('[role="menu"]').should("contain.text", "Edit");
    cy.get('[role="menu"]').should("contain.text", "Delete");
  });

  it("edits an event from the context menu", () => {
    createEvent("Cypress edit event");

    cy.contains("Cypress edit event").rightclick({ force: true });
    cy.get('[role="menu"]').contains("Edit").click();
    cy.get('[role="dialog"]').should("contain.text", "Edit event");
    cy.get("input").first().clear().type("Cypress updated event");
    cy.contains("button", "Save").click();

    cy.contains("Cypress updated event").should("exist");
    cy.contains("Cypress edit event").should("not.exist");
  });

  it("cancels and confirms event deletion", () => {
    createEvent("Cypress delete event");

    cy.contains("Cypress delete event").rightclick({ force: true });
    cy.get('[role="menu"]').contains("Delete").click();
    cy.get('[role="alertdialog"]').should("contain.text", "Delete event?");
    cy.get('[role="alertdialog"]').contains("button", "Cancel").click();
    cy.contains("Cypress delete event").should("exist");

    cy.contains("Cypress delete event").rightclick({ force: true });
    cy.get('[role="menu"]').contains("Delete").click();
    cy.get('[role="alertdialog"]').contains("button", "Delete").click();
    cy.contains("Cypress delete event").should("not.exist");
  });
});
