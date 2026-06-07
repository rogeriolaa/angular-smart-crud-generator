import { describe, it, expect } from 'vitest';
import { parse as parseYaml } from 'yaml';
import { OpenApiParserService } from './openapi-parser.service';
import { MetadataEngineService } from './metadata-engine.service';
import { FieldType, CrudOperationType, RelationType } from '../models';

const PETSTORE_YAML = `
openapi: 3.0.0
info:
  title: Swagger Petstore
  version: 1.0.0
paths:
  /pet:
    get:
      operationId: findPetsByStatus
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
    put:
      operationId: updatePet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/Pet"
      responses:
        "200":
          description: successful operation
  /pet/{petId}:
    get:
      operationId: getPetById
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
    post:
      operationId: updatePetWithForm
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int64
        - name: name
          in: query
          schema:
            type: string
      responses:
        "200":
          description: successful operation
    delete:
      operationId: deletePet
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
  /user:
    post:
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/User"
      responses:
        default:
          description: successful operation
  /user/{username}:
    get:
      operationId: getUserByName
      parameters:
        - name: username
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: successful operation
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
    put:
      operationId: updateUser
      parameters:
        - name: username
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/User"
      responses:
        default:
          description: successful operation
    delete:
      operationId: deleteUser
      parameters:
        - name: username
          in: path
          required: true
          schema:
            type: string
      responses:
        default:
          description: successful operation
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
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
        username:
          type: string
        firstName:
          type: string
        lastName:
          type: string
        email:
          type: string
        password:
          type: string
        phone:
          type: string
        userStatus:
          type: integer
          format: int32
      required:
        - username
        - email
`;

const AUDIT_SOFTDELETE_YAML = `
openapi: 3.0.0
info:
  title: Audit Test
  version: 1.0.0
paths: {}
components:
  schemas:
    AuditedEntity:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        createdBy:
          type: string
        updatedBy:
          type: string
        deletedAt:
          type: string
          format: date-time
          nullable: true
        isDeleted:
          type: boolean
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
`;

describe('MetadataEngineService', () => {
  const parser = new OpenApiParserService();
  const engine = new MetadataEngineService();

  function parseYamlAndBuild(yaml: string) {
    const result = parser.parse(yaml);
    return engine.build(result);
  }

  describe('build', () => {
    it('transforms Petstore schemas to entities', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const entityNames = entities.map(e => e.name);
      expect(entityNames).toContain('Pet');
      expect(entityNames).toContain('Category');
      expect(entityNames).toContain('Tag');
      expect(entityNames).toContain('User');
    });

    it('maps Pet entity fields correctly', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet');
      expect(pet).toBeDefined();
      const fieldNames = pet!.fields.map(f => f.name);
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('category');
      expect(fieldNames).toContain('photoUrls');
      expect(fieldNames).toContain('tags');
      expect(fieldNames).toContain('status');
    });

    it('maps types correctly for Pet entity', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet')!;
      expect(pet.fields.find(f => f.name === 'id')!.type).toBe(FieldType.Integer);
      expect(pet.fields.find(f => f.name === 'name')!.type).toBe(FieldType.String);
      expect(pet.fields.find(f => f.name === 'status')!.type).toBe(FieldType.Enum);
      expect(pet.fields.find(f => f.name === 'category')!.type).toBe(FieldType.Object);
      expect(pet.fields.find(f => f.name === 'photoUrls')!.type).toBe(FieldType.Array);
    });

    it('marks required fields correctly', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet')!;
      expect(pet.fields.find(f => f.name === 'name')!.isRequired).toBe(true);
      expect(pet.fields.find(f => f.name === 'photoUrls')!.isRequired).toBe(true);
      expect(pet.fields.find(f => f.name === 'id')!.isRequired).toBe(false);
    });

    it('extracts enum values', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet')!;
      const statusField = pet.fields.find(f => f.name === 'status')!;
      expect(statusField.enumValues).toContain('available');
      expect(statusField.enumValues).toContain('pending');
      expect(statusField.enumValues).toContain('sold');
    });

    it('maps endpoints to Pet entity', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet')!;
      expect(pet.endpoints.length).toBeGreaterThan(0);
      const ops = pet.endpoints.map(e => e.crudType);
      expect(ops).toContain(CrudOperationType.GetAll);
      expect(ops).toContain(CrudOperationType.GetById);
      expect(ops).toContain(CrudOperationType.Create);
      expect(ops).toContain(CrudOperationType.Delete);
    });

    it('maps endpoints to User entity', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const user = entities.find(e => e.name === 'User')!;
      expect(user.endpoints.length).toBeGreaterThan(0);
      const ops = user.endpoints.map(e => e.crudType);
      expect(ops).toContain(CrudOperationType.Create);
      expect(ops).toContain(CrudOperationType.GetById);
      expect(ops).toContain(CrudOperationType.Update);
      expect(ops).toContain(CrudOperationType.Delete);
    });

    it('detects primary key', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet')!;
      expect(pet.fields.find(f => f.name === 'id')!.isPrimaryKey).toBe(true);
    });

    it('detects audit fields', () => {
      const entities = parseYamlAndBuild(AUDIT_SOFTDELETE_YAML);
      const audited = entities.find(e => e.name === 'AuditedEntity')!;
      expect(audited.fields.find(f => f.name === 'createdAt')!.isAudit).toBe(true);
      expect(audited.fields.find(f => f.name === 'updatedAt')!.isAudit).toBe(true);
      expect(audited.fields.find(f => f.name === 'createdBy')!.isAudit).toBe(true);
      expect(audited.fields.find(f => f.name === 'updatedBy')!.isAudit).toBe(true);
      expect(audited.isAuditEntity).toBe(true);
    });

    it('detects soft delete fields', () => {
      const entities = parseYamlAndBuild(AUDIT_SOFTDELETE_YAML);
      const audited = entities.find(e => e.name === 'AuditedEntity')!;
      expect(audited.fields.find(f => f.name === 'deletedAt')!.isSoftDelete).toBe(true);
      expect(audited.fields.find(f => f.name === 'isDeleted')!.isSoftDelete).toBe(true);
      expect(audited.hasSoftDelete).toBe(true);
    });

    it('does not mark regular fields as audit or soft delete', () => {
      const entities = parseYamlAndBuild(AUDIT_SOFTDELETE_YAML);
      const audited = entities.find(e => e.name === 'AuditedEntity')!;
      expect(audited.fields.find(f => f.name === 'name')!.isAudit).toBe(false);
      expect(audited.fields.find(f => f.name === 'name')!.isSoftDelete).toBe(false);
      expect(audited.fields.find(f => f.name === 'id')!.isAudit).toBe(false);
    });

    it('detects foreign key fields', () => {
      const entities = parseYamlAndBuild(SIMPLE_CRUD_YAML);
      const product = entities.find(e => e.name === 'Product')!;
      const categoryId = product.fields.find(f => f.name === 'categoryId');
      expect(categoryId).toBeDefined();
      expect(categoryId!.isForeignKey).toBe(true);
    });

    it('does not mark id as foreign key', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet')!;
      expect(pet.fields.find(f => f.name === 'id')!.isPrimaryKey).toBe(true);
      expect(pet.fields.find(f => f.name === 'id')!.isForeignKey).toBe(false);
    });

    it('builds validators for minLength/maxLength', () => {
      const entities = parseYamlAndBuild(SIMPLE_CRUD_YAML);
      const product = entities.find(e => e.name === 'Product')!;
      const nameField = product.fields.find(f => f.name === 'name')!;
      expect(nameField.validators).toEqual(
        expect.arrayContaining([
          { type: 'required' },
          { type: 'minLength', value: 3 },
          { type: 'maxLength', value: 100 },
        ])
      );
    });

    it('builds validators for minimum', () => {
      const entities = parseYamlAndBuild(SIMPLE_CRUD_YAML);
      const product = entities.find(e => e.name === 'Product')!;
      const priceField = product.fields.find(f => f.name === 'price')!;
      expect(priceField.validators).toEqual(
        expect.arrayContaining([
          { type: 'required' },
          { type: 'min', value: 0 },
        ])
      );
    });

    it('merges DTO fields into main entity', () => {
      const entities = parseYamlAndBuild(SIMPLE_CRUD_YAML);
      const product = entities.find(e => e.name === 'Product')!;
      const fieldNames = product.fields.map(f => f.name);
      expect(fieldNames).toContain('id');
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('description');
      expect(fieldNames).toContain('price');
      expect(fieldNames).toContain('categoryId');
    });

    it('detects relationships from $ref fields', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet')!;
      const categoryRel = pet.relationships.find(r => r.targetEntity === 'Category');
      expect(categoryRel).toBeDefined();
      expect(categoryRel!.type).toBe(RelationType.OneToOne);
    });

    it('detects array relationships', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      const pet = entities.find(e => e.name === 'Pet')!;
      const tagsRel = pet.relationships.find(r => r.targetEntity === 'Tag');
      expect(tagsRel).toBeDefined();
      expect(tagsRel!.type).toBe(RelationType.OneToMany);
    });

    it('returns empty array for empty parse result', () => {
      const result = parser.parse(JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Empty', version: '1.0.0' },
        paths: {},
      }));
      const entities = engine.build(result);
      expect(entities).toEqual([]);
    });

    it('pluralizes entity names', () => {
      const entities = parseYamlAndBuild(PETSTORE_YAML);
      expect(entities.find(e => e.name === 'Category')!.namePlural).toBe('Categories');
      expect(entities.find(e => e.name === 'User')!.namePlural).toBe('Users');
    });
  });
});
