/* tslint:disable: class-name */

interface integer {}

declare module Example {
  /** A product from "Acme"'s catalog */
  interface Product {
    /**
      The unique identifier for a product
      @minimum 0
      @exclusiveMinimum
    */
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
    /**
      @integer
    */
    age: number;
  }

  interface Company {
    companyId: [string, number]
    persons: Person[];
    products: Product[];
  }

  /** @integer */
  type Int = number;
  type Value = number | string;
  type StrArray = string[];

  interface SomeTypes {
    i1: integer;
    i2: Int;  // TODO expected `integer` type but actual `number` type
    v: Value;
    varray: [Value, Value];
    scale: number | [number, number];
    strs: StrArray;
    x: any;
  }

  interface Indexed1 {
    [key: string]: string;
  }
  interface Indexed2 {
    [key: string]: SomeTypes;
  }
  interface Indexed3 {
    [key: string]: any;
  }
}

