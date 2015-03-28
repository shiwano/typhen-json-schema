/* tslint:disable: class-name */

interface integer {}

declare module Example {
  /** A product from "Acme"'s catalog */
  interface Product {
    /** The unique identifier for a product */
    id: integer;
    /** Name of the product */
    name: string;
    /**
      @minimum 0
      @exclusiveMinimum
     */
    price: number;
    /**
      @minItems 1
      @uniqueItems
     */
    tags?: string[];
  }

  class Person {
    firstName: string;
    lastName: string;
    /**
      @format date
     */
    birthday: string;
    address: {
      streetAddress: string;
      city: string;
      state: string;
      country: string;
    }
  }

  interface Company {
    companyId: [string, number]
    persons: Person[];
    products: Product[];
  }
}
