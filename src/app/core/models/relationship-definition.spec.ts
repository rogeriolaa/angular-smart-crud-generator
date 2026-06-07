import { describe, it, expect } from 'vitest';
import { RelationType, RelationshipDefinition } from './relationship-definition';

describe('RelationType', () => {
  it('has expected values', () => {
    expect(RelationType.OneToOne).toBe('OneToOne');
    expect(RelationType.OneToMany).toBe('OneToMany');
    expect(RelationType.ManyToMany).toBe('ManyToMany');
  });
});

describe('RelationshipDefinition', () => {
  it('can be instantiated for OneToOne', () => {
    const rel: RelationshipDefinition = {
      type: RelationType.OneToOne,
      sourceEntity: 'User',
      targetEntity: 'Profile',
      sourceField: 'profileId',
    };
    expect(rel.type).toBe(RelationType.OneToOne);
    expect(rel.sourceEntity).toBe('User');
    expect(rel.targetEntity).toBe('Profile');
    expect(rel.sourceField).toBe('profileId');
  });

  it('can be instantiated for OneToMany', () => {
    const rel: RelationshipDefinition = {
      type: RelationType.OneToMany,
      sourceEntity: 'Customer',
      targetEntity: 'Order',
      sourceField: 'customerId',
      foreignKey: 'customerId',
    };
    expect(rel.type).toBe(RelationType.OneToMany);
    expect(rel.foreignKey).toBe('customerId');
  });

  it('can be instantiated for ManyToMany with targetField', () => {
    const rel: RelationshipDefinition = {
      type: RelationType.ManyToMany,
      sourceEntity: 'User',
      targetEntity: 'Role',
      sourceField: 'roleIds',
      targetField: 'userId',
    };
    expect(rel.type).toBe(RelationType.ManyToMany);
    expect(rel.targetField).toBe('userId');
  });
});
