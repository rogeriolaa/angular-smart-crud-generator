import { describe, it, expect } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { OpenApiParserService } from './openapi-parser.service';

const PETSTORE_YAML = `
openapi: 3.0.0
info:
  title: Swagger Petstore
  version: 1.0.0
paths:
  /pet:
    get:
      operationId: findPetsByStatus
      summary: Finds Pets by status
      parameters:
        - name: status
          in: query
          schema:
            type: string
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
    post:
      operationId: addPet
      summary: Add a new pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
    delete:
      operationId: deletePet
      summary: Deletes a pet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        "200":
          description: successful operation
  /pet/{petId}:
    get:
      operationId: getPetById
      summary: Find pet by ID
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
  /pet/findByStatus:
    get:
      operationId: findPetsByStatus_1
      summary: Finds Pets by status
      parameters:
        - name: status
          in: query
          required: true
          schema:
            type: string
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
components:
  schemas:
    Pet:
      type: object
      required:
        - name
        - photoUrls
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
          example: doggie
        category:
          $ref: "#/components/schemas/Category"
        photoUrls:
          type: array
          items:
            type: string
        tags:
          type: array
          items:
            $ref: "#/components/schemas/Tag"
        status:
          type: string
          description: pet status in the store
          enum:
            - available
            - pending
            - sold
    Category:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
    Tag:
      type: object
      properties:
        id:
          type: integer
          format: int64
        name:
          type: string
`;

const SIMPLE_CRUD_YAML = `
openapi: 3.1.0
info:
  title: Simple CRUD API
  version: 1.0.0
paths:
  /products:
    get:
      operationId: listProducts
      summary: List all products
      responses:
        "200":
          description: A list of products
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Product"
    post:
      operationId: createProduct
      summary: Create a product
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateProductDto"
      responses:
        "201":
          description: Product created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Product"
  /products/{productId}:
    get:
      operationId: getProductById
      summary: Get a product by ID
      parameters:
        - name: productId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: A product
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Product"
    put:
      operationId: updateProduct
      summary: Update a product
      parameters:
        - name: productId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateProductDto"
      responses:
        "200":
          description: Product updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Product"
    delete:
      operationId: deleteProduct
      summary: Delete a product
      parameters:
        - name: productId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "204":
          description: Product deleted
components:
  schemas:
    Product:
      type: object
      required:
        - name
        - price
      properties:
        id:
          type: integer
          readOnly: true
        name:
          type: string
          minLength: 3
          maxLength: 100
        description:
          type: string
        price:
          type: number
          minimum: 0
        categoryId:
          type: integer
        tags:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        deletedAt:
          type: string
          format: date-time
          nullable: true
    CreateProductDto:
      type: object
      required:
        - name
        - price
      properties:
        name:
          type: string
          minLength: 3
          maxLength: 100
        description:
          type: string
        price:
          type: number
          minimum: 0
        categoryId:
          type: integer
        tags:
          type: array
          items:
            type: string
    UpdateProductDto:
      type: object
      properties:
        name:
          type: string
          minLength: 3
          maxLength: 100
        description:
          type: string
        price:
          type: number
          minimum: 0
        categoryId:
          type: integer
        tags:
          type: array
          items:
            type: string
`;

describe('OpenApiParserService', () => {
  const service = new OpenApiParserService();

  describe('parse', () => {
    it('parses valid Petstore YAML', () => {
      const result = service.parse(PETSTORE_YAML);
      expect(result.title).toBe('Swagger Petstore');
      expect(result.version).toBe('1.0.0');
      expect(result.errors).toEqual([]);
    });

    it('parses valid Petstore as JSON', () => {
      const parsed = parseYaml(PETSTORE_YAML);
      const json = JSON.stringify(parsed);
      const result = service.parse(json);
      expect(result.title).toBe('Swagger Petstore');
      expect(result.errors).toEqual([]);
    });

    it('parses simple CRUD spec', () => {
      const result = service.parse(SIMPLE_CRUD_YAML);
      expect(result.title).toBe('Simple CRUD API');
      expect(result.schemas.length).toBeGreaterThanOrEqual(3);
    });

    it('extracts schemas from Petstore', () => {
      const result = service.parse(PETSTORE_YAML);
      const schemaNames = result.schemas.map(s => s.name);
      expect(schemaNames).toContain('Pet');
      expect(schemaNames).toContain('Category');
      expect(schemaNames).toContain('Tag');
    });

    it('extracts endpoints from Petstore', () => {
      const result = service.parse(PETSTORE_YAML);
      expect(result.endpoints.length).toBeGreaterThan(0);
      const getPetById = result.endpoints.find(
        e => e.operationId === 'getPetById'
      );
      expect(getPetById).toBeDefined();
      expect(getPetById!.method).toBe('GET');
      expect(getPetById!.path).toBe('/pet/{petId}');
    });

    it('detects request body references', () => {
      const result = service.parse(PETSTORE_YAML);
      const addPet = result.endpoints.find(e => e.operationId === 'addPet');
      expect(addPet).toBeDefined();
      expect(addPet!.requestBodyRef).toBe('Pet');
    });

    it('detects response references', () => {
      const result = service.parse(PETSTORE_YAML);
      const getPetById = result.endpoints.find(
        e => e.operationId === 'getPetById'
      );
      expect(getPetById).toBeDefined();
      expect(getPetById!.responseRef).toBe('Pet');
    });

    it('detects array responses', () => {
      const result = service.parse(PETSTORE_YAML);
      const findPets = result.endpoints.find(
        e => e.operationId === 'findPetsByStatus'
      );
      expect(findPets).toBeDefined();
      expect(findPets!.responseIsArray).toBe(true);
    });

    it('extracts parameters from path', () => {
      const result = service.parse(PETSTORE_YAML);
      const getPetById = result.endpoints.find(
        e => e.operationId === 'getPetById'
      );
      expect(getPetById!.parameters).toHaveLength(1);
      expect(getPetById!.parameters[0].name).toBe('petId');
      expect(getPetById!.parameters[0].in).toBe('path');
      expect(getPetById!.parameters[0].required).toBe(true);
    });

    it('extracts field properties from schemas', () => {
      const result = service.parse(PETSTORE_YAML);
      const petSchema = result.schemas.find(s => s.name === 'Pet');
      expect(petSchema).toBeDefined();
      const propNames = petSchema!.properties.map(p => p.name);
      expect(propNames).toContain('id');
      expect(propNames).toContain('name');
      expect(propNames).toContain('status');
    });

    it('marks required fields from schema', () => {
      const result = service.parse(PETSTORE_YAML);
      const petSchema = result.schemas.find(s => s.name === 'Pet');
      const nameProp = petSchema!.properties.find(p => p.name === 'name');
      expect(nameProp!.required).toBe(true);
      const idProp = petSchema!.properties.find(p => p.name === 'id');
      expect(idProp!.required).toBe(false);
    });

    it('extracts enum values', () => {
      const result = service.parse(PETSTORE_YAML);
      const petSchema = result.schemas.find(s => s.name === 'Pet');
      const statusProp = petSchema!.properties.find(p => p.name === 'status');
      expect(statusProp!.enumValues).toContain('available');
      expect(statusProp!.enumValues).toContain('pending');
      expect(statusProp!.enumValues).toContain('sold');
    });

    it('extracts minLength/maxLength from properties', () => {
      const result = service.parse(SIMPLE_CRUD_YAML);
      const productSchema = result.schemas.find(s => s.name === 'Product');
      const nameProp = productSchema!.properties.find(p => p.name === 'name');
      expect(nameProp!.minLength).toBe(3);
      expect(nameProp!.maxLength).toBe(100);
    });

    it('extracts minimum from properties', () => {
      const result = service.parse(SIMPLE_CRUD_YAML);
      const productSchema = result.schemas.find(s => s.name === 'Product');
      const priceProp = productSchema!.properties.find(p => p.name === 'price');
      expect(priceProp!.minimum).toBe(0);
    });

    it('recognizes $ref in properties', () => {
      const result = service.parse(PETSTORE_YAML);
      const petSchema = result.schemas.find(s => s.name === 'Pet');
      const categoryProp = petSchema!.properties.find(p => p.name === 'category');
      expect(categoryProp!.ref).toBe('Category');
    });

    it('recognizes $ref in array items', () => {
      const result = service.parse(PETSTORE_YAML);
      const petSchema = result.schemas.find(s => s.name === 'Pet');
      const tagsProp = petSchema!.properties.find(p => p.name === 'tags');
      expect(tagsProp!.items?.ref).toBe('Tag');
    });

    it('handles missing openapi field', () => {
      const result = service.parse(JSON.stringify({ info: { title: 'No Version' } }));
      expect(result.errors).toContain('Missing required field: openapi');
    });

    it('handles empty input', () => {
      const result = service.parse('');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles invalid input', () => {
      const result = service.parse('not valid yaml or json {{{');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('returns empty arrays for spec with no paths', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Empty', version: '1.0.0' },
      };
      const result = service.parse(JSON.stringify(spec));
      expect(result.schemas).toEqual([]);
      expect(result.endpoints).toEqual([]);
    });

    it('returns empty arrays for spec with no schemas', () => {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'No Schemas', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              operationId: 'test',
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      };
      const result = service.parse(JSON.stringify(spec));
      expect(result.schemas).toEqual([]);
      expect(result.endpoints).toHaveLength(1);
    });
  });
});
