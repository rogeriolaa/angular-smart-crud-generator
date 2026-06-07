export enum RelationType {
  OneToOne = 'OneToOne',
  OneToMany = 'OneToMany',
  ManyToMany = 'ManyToMany',
}

export interface RelationshipDefinition {
  type: RelationType;
  sourceEntity: string;
  targetEntity: string;
  sourceField: string;
  targetField?: string;
  foreignKey?: string;
}
