/*global define, window, Ext, Y, JsMockito, tests */
define( [
	'jquery',
	'lodash',
	'Class',
	'data/Data',
	'data/NativeObjectConverter',
	'data/DataComponent',
	'data/Model',
	'data/Collection',
	'data/attribute/Attribute',
	'data/attribute/Boolean',
	'data/attribute/Number',
	'data/attribute/String',
	'data/attribute/DataComponent',
	'data/persistence/ResultSet',
	'data/persistence/Proxy',
	'data/persistence/RestProxy',
	'data/persistence/operation/ReadOperation',
	'data/persistence/operation/WriteOperation'
], function( 
	jQuery,
	_,
	Class,
	Data,
	NativeObjectConverter,
	DataComponent,
	Model,
	Collection,
	Attribute,
	BooleanAttribute,
	NumberAttribute,
	StringAttribute,
	DataComponentAttribute,
	ResultSet,
	Proxy,
	RestProxy,
	ReadOperation,
	WriteOperation
) {

	tests.unit.add( new Ext.test.TestSuite( {
		name: 'Data.Model',
		
		
		items : [
			{
				/*
				 * Test the onClassExtended static method 
				 */
				name : "Test the onClassExtended static method",
				
				
				"After extending model, the subclass should have a unique __Data_modelTypeId property" : function() {
					var MyModel = Model.extend( {} );
					
					Y.Assert.isString( MyModel.__Data_modelTypeId, "The Model should now have a static __Data_modelTypeId property that is a string" );
				},
				
				
				// ------------------------
				
				// Test Attributes Inheritance
				
				
				"Attributes should inherit from a Model subclass's superclass when the subclass defines no attributes of its own" : function() {
					var MyModel = Model.extend( {
						attributes : [ 'field1' ]
					} );
					var SubClassModel = MyModel.extend( {} );
					
					var attributes = (new SubClassModel()).attributes;
					Y.Assert.areSame( 1, _.keys( attributes ).length, "There should be exactly 1 attribute" );
					Y.ObjectAssert.hasKey( 'field1', attributes, "field1 should exist as the attribute" );
				},
				
				
				"Attributes should inherit from a Model subclass's superclass when the subclass does define attributes of its own" : function() {
					// Reference the base class, and create a subclass
					var MyModel = Model.extend( {} );
					var SubClassModel = MyModel.extend( {
						attributes : [ 'a', 'b' ]
					} );
					
					var attributes = (new SubClassModel()).attributes;
					Y.Assert.areSame( 2, _.keys( attributes ).length, "There should be exactly 2 attributes" );
					Y.ObjectAssert.hasKey( 'a', attributes, "SubClassModel should have the 'a' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'b', attributes, "SubClassModel should have the 'b' attribute defined in its final 'attributes' hash." );
				},
				
				
				"Attributes should inherit from a Model subclass's superclass, and its superclass as well (i.e. more than one level up)" : function() {
					// Reference the base class, and create two subclasses
					var MyModel = Model.extend( {} );
					var SubClassModel = Class.extend( MyModel, {
						attributes : [ 'a', 'b' ]
					} );
					var SubSubClassModel = Class.extend( SubClassModel, {
						attributes : [ 'c', 'd', 'e' ]
					} );
					
					var attributes = (new SubSubClassModel()).attributes;
					Y.Assert.areSame( 5, _.keys( attributes ).length, "There should be exactly 5 attributes" );
					Y.ObjectAssert.hasKey( 'a', attributes, "SubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'b', attributes, "SubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'c', attributes, "SubSubClassModel should have the 'c' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'd', attributes, "SubSubClassModel should have the 'd' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'e', attributes, "SubSubClassModel should have the 'e' attribute defined in its final 'attributes' hash." );
				},
				
				
				"Attributes should inherit from a Model subclass's superclass, and all of its superclasses (i.e. more than two levels up)" : function() {
					// Reference the base class, and create two subclasses
					var MyModel = Model.extend( {} );
					var SubClassModel = Class.extend( MyModel, {
						attributes : [ 'a', 'b' ]
					} );
					var SubSubClassModel = Class.extend( SubClassModel, {
						attributes : [ 'c', 'd', 'e' ]
					} );
					var SubSubSubClassModel = Class.extend( SubSubClassModel, {
						attributes : [ 'f' ]
					} );
					
					var attributes = (new SubSubSubClassModel()).attributes;
					Y.Assert.areSame( 6, _.keys( attributes ).length, "There should be exactly 6 attributes" );
					Y.ObjectAssert.hasKey( 'a', attributes, "SubSubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'b', attributes, "SubSubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'c', attributes, "SubSubSubClassModel should have the 'c' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'd', attributes, "SubSubSubClassModel should have the 'd' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'e', attributes, "SubSubSubClassModel should have the 'e' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'f', attributes, "SubSubSubClassModel should have the 'f' attribute defined in its final 'attributes' hash." );
				},
				
				
				"Attribute definitions defined in a subclass should take precedence over attribute definitions in a superclass" : function() {
					var MyModel = Model.extend( {} );
					var SubClassModel = Class.extend( MyModel, {
						attributes : [ { name : 'a', defaultValue: 1 } ]
					} );
					var SubSubClassModel = Class.extend( SubClassModel, {
						attributes : [ { name : 'a', defaultValue: 2 }, 'b' ]
					} );
					
					var attributes = (new SubSubClassModel()).attributes;
					Y.Assert.areSame( 2, _.keys( attributes ).length, "There should be exactly 2 attributes" );
					Y.ObjectAssert.hasKey( 'a', attributes, "SubSubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'b', attributes, "SubSubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash." );
					
					// Check that the default value of the Attribute 'a' is 2, not 1 (as the Attribute in the subclass should have overridden its superclass Attribute)
					Y.Assert.areSame( 2, attributes.a.defaultValue, "The attribute in the subclass should have overridden its superclass" ); 
				},
				
				
				"A subclass that doesn't define any attributes should inherit all of them from its superclass(es)" : function() {
					// Reference the base class, and create two subclasses
					var MyModel = Model.extend( {} );
					var SubClassModel = Class.extend( MyModel, {
						attributes : [ 'a', 'b' ]
					} );
					var SubSubClassModel = Class.extend( SubClassModel, {} );
					
					var attributes = (new SubSubClassModel()).attributes;
					Y.Assert.areSame( 2, _.keys( attributes ).length, "There should be exactly 2 attributes" );
					Y.ObjectAssert.hasKey( 'a', attributes, "SubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'b', attributes, "SubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash." );
				},
				
				
				"A superclass that doesn't define any attributes should be skipped for attributes, but the subclass should still inherit from superclasses above it" : function() {
					// Reference the base class, and create two subclasses
					var MyModel = Model.extend( {} );
					var SubClassModel = Class.extend( MyModel, {} );  // one that doesn't define any attributes
					var SubSubClassModel = Class.extend( SubClassModel, {
						attributes : [ 'a', 'b' ]
					} );
					
					var attributes = (new SubSubClassModel()).attributes;
					Y.Assert.areSame( 2, _.keys( attributes ).length, "There should be exactly 2 attributes" );
					Y.ObjectAssert.hasKey( 'a', attributes, "SubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'b', attributes, "SubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash." );
				},
				
				
				// -------------------------------
				
				
				"Yet another test for attributes inheritance..." : function() {
					var MyModel = Model.extend( {
						attributes : [ 'a', 'b' ]
					} );
					var SubModel = MyModel.extend( {
						attributes : [ 'c' ]
					} );
					
					var attributes = (new SubModel()).attributes;
					Y.Assert.areSame( 3, _.keys( attributes ).length, "There should be exactly 3 attributes" );
					Y.ObjectAssert.hasKey( 'a', attributes, "SubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'b', attributes, "SubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash." );
					Y.ObjectAssert.hasKey( 'c', attributes, "SubSubClassModel should have the 'c' attribute defined in its final 'attributes' hash." );
				}
			},
			
			
			{
				/*
				 * Test the getAttributes() static method 
				 */
				name : "Test the getAttributes() static method",
				
				
				"The getAttributes() static method should retrieve a hashmap of the attributes for the model" : function() {
					var SuperclassModel = Model.extend( {
						attributes : [
							{ name: 'id', type: 'float' },
							{ name: 'superclassAttr', type: 'string' }
						]
					} );
					
					var SubclassModel = SuperclassModel.extend( {
						attributes : [
							{ name: 'subclassAttr', type: 'boolean' }
						]
					} );
					
					
					var superclassModelAttrs = SuperclassModel.getAttributes();   // call the static method
					var superclassModelAttrKeys = _.keys( superclassModelAttrs );
					Y.Assert.areSame( 2, superclassModelAttrKeys.length, "There should have been 2 keys in the array for the superclassModelAttrKeys" );
					Y.Assert.isTrue( _.contains( superclassModelAttrKeys, 'id' ), "The key 'id' should exist" );
					Y.Assert.isTrue( _.contains( superclassModelAttrKeys, 'superclassAttr' ), "The key 'superclassAttr' should exist" );
					Y.Assert.isInstanceOf( NumberAttribute, superclassModelAttrs.id, "The `id` Attribute should have been an instance of Number" );
					Y.Assert.isInstanceOf( StringAttribute, superclassModelAttrs.superclassAttr, "The `superclassAttr` Attribute should have been an instance of String" );
					
					var subclassModelAttrs = SubclassModel.getAttributes();    // call the static method on the subclass (which should be statically inherited by the subclass)
					var subclassModelAttrKeys = _.keys( subclassModelAttrs );
					Y.Assert.areSame( 3, subclassModelAttrKeys.length, "There should have been 3 keys in the array for the subclassModelAttrKeys" );
					Y.Assert.isTrue( _.contains( subclassModelAttrKeys, 'id' ), "The key 'id' should exist" );
					Y.Assert.isTrue( _.contains( subclassModelAttrKeys, 'superclassAttr' ), "The key 'superclassAttr' should exist" );
					Y.Assert.isTrue( _.contains( subclassModelAttrKeys, 'subclassAttr' ), "The key 'subclassAttr' should exist" );
					Y.Assert.isInstanceOf( NumberAttribute, subclassModelAttrs.id, "The `id` Attribute should have been an instance of Number" );
					Y.Assert.isInstanceOf( StringAttribute, subclassModelAttrs.superclassAttr, "The `superclassAttr` Attribute should have been an instance of String" );
					Y.Assert.isInstanceOf( BooleanAttribute, subclassModelAttrs.subclassAttr, "The `subclassAttr` Attribute should have been an instance of Boolean" );
				}
				
			},
		
		
			// ----------------------------------------------------------
			
			
			{
				/*
				 * Test Initialization (constructor)
				 */
				name: 'Test Initialization (constructor)',
				ttype : 'testsuite',
				
				
				items : [
					{
						/*
						 * Test lazy instantiating a proxy
						 */
						name : "Test lazy instantiating a proxy",
						
						_should : {
							error : {
								"Attempting to instantiate a proxy with no 'type' attribute should throw an error" :
									"Data.persistence.Proxy.create(): No `type` property provided on proxy config object",
									
								"Attempting to instantiate a proxy with an invalid 'type' attribute should throw an error" :
									"Data.persistence.Proxy.create(): Unknown Proxy type: 'nonexistentproxy'"
							}
						},
						
						"Attempting to instantiate a proxy with no 'type' attribute should throw an error" : function() {
							var TestModel = Class.extend( Model, {
								attributes: [ 'attribute1' ],
								proxy : {}
							} );
							
							var model = new TestModel();
						},
						
						"Attempting to instantiate a proxy with an invalid 'type' attribute should throw an error" : function() {
							var TestModel = Class.extend( Model, {
								attributes: [ 'attribute1' ],
								proxy : { 
									type : 'nonExistentProxy'
								}
							} );
							
							var model = new TestModel();
						},
						
						"Providing a valid config object should instantiate the Proxy *on class's the prototype*" : function() {
							var TestModel = Class.extend( Model, {
								attributes: [ 'attribute1' ],
								proxy : { 
									type : 'rest'  // a valid proxy type
								}
							} );
							
							var model = new TestModel();
							Y.Assert.isInstanceOf( RestProxy, TestModel.prototype.proxy );
						},
						
						"Providing a valid config object should instantiate the Proxy *on the correct subclass's prototype*, shadowing superclasses" : function() {
							var TestModel = Class.extend( Model, {
								attributes: [ 'attribute1' ],
								proxy : { 
									type : 'nonExistentProxy'  // an invalid proxy type
								}
							} );
							
							var TestSubModel = Class.extend( TestModel, {
								attributes: [ 'attribute1' ],
								proxy : { 
									type : 'rest'  // a valid proxy type
								}
							} );
							
							var model = new TestSubModel();
							Y.Assert.isInstanceOf( RestProxy, TestSubModel.prototype.proxy );
						}
					},
					
				
					{
						/*
						 * Test change event upon initialization
						 */
						name : "Test change event upon initialization",
						
						setUp : function() {
							this.TestModel = Class.extend( Model, {
								attributes: [
									{ name: 'attribute1' },
									{ name: 'attribute2', defaultValue: "attribute2's default" },
									{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
									{ name: 'attribute4', set : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } },
									{ name: 'attribute5', set : function( newValue ) { return newValue + " " + newValue.get( 'attribute2' ); } }
								]
							} );
						},
						
						
						/* This test is no longer valid, as the constructor currently does not allow for a `listeners` config
						"The Model should not fire its 'change' event during the set of the initial data" : function() {
							var changeEventFired = false;
							var model = new this.TestModel( {
								attribute1: "attribute1 value"
							} );
							
							//model.addListener( 'change', function() { changeEventFired = true; } );
							Y.Assert.isFalse( changeEventFired, "The change event should not have fired during the set of the initial data" );
						},
						*/
						
						"The Model should fire its 'change' event when an attribute's data is set externally" : function() {
							var changeEventFired = false;
							var model = new this.TestModel();
							model.addListener( 'change', function() { changeEventFired = true; } );
							
							// Set the value
							model.set( 'attribute1', 'value1' );
							Y.Assert.isTrue( changeEventFired, "The change event should have been fired during the set of the new data" );
						}
					},
				
				
					{
						/*
						 * Test that the initial default values are applied
						 */
						name : "Test that the initial default values are applied",
						
						setUp : function() {
							this.TestModel = Class.extend( Model, {
								attributes: [
									{ name: 'attribute1' },
									{ name: 'attribute2', defaultValue: "attribute2's default" },
									{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
									{ name: 'attribute4', set : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } },
									{ name: 'attribute5', set : function( newValue ) { return newValue + " " + this.get( 'attribute2' ); } }
								]
							} );
						},
				
						// Test that default values are applied to attribute values
						
						"A attribute with a defaultValue but no provided data should have its defaultValue when retrieved" : function() {
							var model = new this.TestModel();  // no data provided
							
							Y.Assert.areSame( "attribute2's default", model.get( 'attribute2' ) );
						},
						
						"A attribute with a defaultValue that is a function, but no provided data should have its defaultValue when retrieved" : function() {
							var model = new this.TestModel();  // no data provided
							
							Y.Assert.areSame( "attribute3's default", model.get( 'attribute3' ) );  // attribute3 has a defaultValue that is a function
						},
						
						"A attribute with a defaultValue and also provided data should have its provided data when retrieved" : function() {
							var model = new this.TestModel( {
								attribute2 : "attribute2's data"
							} );
							
							Y.Assert.areSame( "attribute2's data", model.get( 'attribute2' ), "The 'default' specified on the Attribute should *not* have been applied, since it has a value." );
						}
					},
					
					{
						/*
						 * Test initial data
						 */
						name : "Test initial data",
						
						"Providing initial data to the constructor should not leave the model set as 'modified' (i.e. it should have no 'changes')" : function() {
							var MyModel = Model.extend( {
								attributes : [ 'attribute1', 'attribute2' ]
							} );
							
							var model = new MyModel( { attribute1: 'value1', attribute2: 'value2' } );
							Y.Assert.isFalse( model.isModified(), "The model should not be modified upon initialization" );
							Y.Assert.isTrue( _.isEmpty( model.getChanges() ), "There should not be any 'changes' upon initialization" );
						}
					},				
					
					
					{
						/*
						 * Test that initialize() is called
						 */
						name : "Test that initialize() is called",
						
						
						"The initialize() method should be called with the constructor function, for subclass initialization" : function() {
							var initializeCalled = false;
							
							var MyModel = Model.extend( {
								attributes : [ 
									'test',
									{ name: 'test2', defaultValue: 'defaultForTest2' }
								],
								initialize : function() {
									initializeCalled = true;
								}
							} );
							
							var model = new MyModel();
							Y.Assert.isTrue( initializeCalled, "The initialize() method should have been called" ); 
						}
					}
				]
			},		
			
			
			
			{
				/*
				 * Test getId()
				 */
				name : "Test getId()",
				
				_should : {
					error : {
						"getId() should throw an error if the default idAttribute 'id' does not exist on the model" : 
							"Error: The `idAttribute` (currently set to an attribute named 'id') was not found on the Model. Set the `idAttribute` config to the name of the id attribute in the Model. The model can't be saved or destroyed without it.",
						"getId() should throw an error with a custom idAttribute that does not relate to an attribute on the model" : 
							"Error: The `idAttribute` (currently set to an attribute named 'myIdAttribute') was not found on the Model. Set the `idAttribute` config to the name of the id attribute in the Model. The model can't be saved or destroyed without it."
					}
				},
				
				"getId() should throw an error if the default idAttribute 'id' does not exist on the model" : function() {
					var MyModel = Model.extend( {
						attributes : [
							// note: no attribute named 'id'
							'field1',
							'field2'
						]
					} );
					
					var model = new MyModel();
					model.getId();
					
					Y.Assert.fail( "The test should have errored" );
				},
				
				
				"getId() should throw an error with a custom idAttribute that does not relate to an attribute on the model" : function() {
					var MyModel = Model.extend( {
						attributes : [
							'field1',
							'field2'
						],
						
						idAttribute: 'myIdAttribute'
					} );
					
					var model = new MyModel();
					model.getId();
					
					Y.Assert.fail( "The test should have errored" );
				},
				
				
				"getId() should return the value of the idAttribute" : function() {
					var MyModel = Model.extend( {
						attributes : [ 'myIdAttribute' ],
						idAttribute: 'myIdAttribute'
					} );
					
					var model = new MyModel( {
						myIdAttribute: 1
					} );
					
					Y.Assert.areSame( 1, model.getId() );
				}
			},
			
			
			{
				/*
				 * Test getIdAttribute()
				 */
				name : "Test getIdAttribute()",
				
				
				"getIdAttribute() should return the Attribute referenced by the 'idAttribute' config" : function() {
					var MyModel = Model.extend( {
						attributes: [ 'id' ],
						idAttribute: 'id'
					} );
					
					var model = new MyModel();
					Y.Assert.isInstanceOf( Attribute, model.getIdAttribute() );
				},
				
				
				"getIdAttribute() should return null if there is no attribute referenced by the 'idAttribute' config" : function() {
					var MyModel = Model.extend( {
						attributes: [ 'id' ],
						idAttribute: 'ooglyBoogly'
					} );
					
					var model = new MyModel();
					Y.Assert.isNull( model.getIdAttribute() );
				}
			},
			
			
			{
				/*
				 * Test getIdAttributeName()
				 */
				name : "Test getIdAttributeName()",
				
				
				"getIdAttributeName() should return the value of the 'idAttribute' config" : function() {
					var MyModel = Model.extend( {
						attributes: [ 'id' ],
						idAttribute: 'myBrandyNewIdAttribute'  // doesn't matter if there is no attribute that matches the idAttribute's name (for now...) 
					} );
					
					var model = new MyModel();
					Y.Assert.areSame( 'myBrandyNewIdAttribute', model.getIdAttributeName() );
				}
			},
			
			
			{
				/*
				 * Test hasIdAttribute()
				 */
				name : "Test hasIdAttribute()",
				
				
				"hasIdAttribute should return false when the idAttribute config does not reference a valid Attribute" : function() {
					var MyModel = Model.extend( {
						attributes  : [ 'attr' ],  // note: no "id" attribute
						idAttribute : 'id'
					} );
					
					var model = new MyModel();
					Y.Assert.isFalse( model.hasIdAttribute() );
				},
				
				
				"hasIdAttribute should return truue when the idAttribute config does reference a valid Attribute" : function() {
					var MyModel = Model.extend( {
						attributes  : [ 'id', 'attr' ],
						idAttribute : 'id'
					} );
					
					var model = new MyModel();
					Y.Assert.isTrue( model.hasIdAttribute() );
				}
			},
			
			{
				/*
				 * Test set()
				 */
				name: 'Test set()',
		
		
				setUp : function() {
					this.TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', defaultValue: "attribute2's default" },
							{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
							{ name: 'attribute4', set : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } },
							{ name: 'attribute5', set : function( newValue ) { return newValue + " " + this.get( 'attribute2' ); } }
						]
					} );
				},
				
				
				
				_should : {
					error : {
						"set() should throw an error when trying to set an attribute that isn't defined (using the attr and value args)" :
							"Data.Model.set(): An attribute with the attributeName 'nonExistentAttr' was not found.",
						"set() should throw an error when trying to set an attribute that isn't defined (using the attr as an object literal arg)" :
							"Data.Model.set(): An attribute with the attributeName 'nonExistentAttr' was not found."
					}
				},
				
				
				"set() should throw an error when trying to set an attribute that isn't defined (using the attr and value args)" : function() {
					var model = new this.TestModel();
					model.set( 'nonExistentAttr', 1 );
					
					Y.Assert.fail( "Test should have thrown an error" );
				},
				
				
				"set() should throw an error when trying to set an attribute that isn't defined (using the attr as an object literal arg)" : function() {
					var model = new this.TestModel();
					model.set( { 'nonExistentAttr': 1 } );
					
					Y.Assert.fail( "Test should have thrown an error" );
				},
				
				
				// -----------------------------
				
				
				/*
				 * Utility method to set the given attribute to all data types, including falsy values, and asserts that the operation was successful
				 * (i.e. the attribute returns the same exact value it was set to).
				 * 
				 * @method assertAttributeAcceptsAll
				 * @param {Model} model
				 * @param {String} attributeName
				 */
				assertAttributeAcceptsAll : function( model, attributeName ) {
					model.set( attributeName, undefined );
					Y.Assert.isUndefined( model.get( attributeName ), attributeName + "'s value should have the value set by set() (undefined)." );
					
					model.set( attributeName, null );
					Y.Assert.isNull( model.get( attributeName ), attributeName + "'s value should have the value set by set() (null)." );
					
					model.set( attributeName, true );
					Y.Assert.isTrue( model.get( attributeName ), attributeName + "'s value should have the value set by set() (true)." );
					
					model.set( attributeName, false );
					Y.Assert.isFalse( model.get( attributeName ), attributeName + "'s value should have the value set by set() (false)." );
					
					model.set( attributeName, 0 );
					Y.Assert.areSame( 0, model.get( attributeName ), attributeName + "'s value should have the value set by set() (0)." );
					
					model.set( attributeName, 1 );
					Y.Assert.areSame( 1, model.get( attributeName ), attributeName + "'s value should have the value set by set() (1)." );
					
					model.set( attributeName, "" );
					Y.Assert.areSame( "", model.get( attributeName ), attributeName + "'s value should have the value set by set() ('')." );
					
					model.set( attributeName, "Hello" );
					Y.Assert.areSame( "Hello", model.get( attributeName ), attributeName + "'s value should have the value set by set() ('Hello')." );
					
					model.set( attributeName, {} );
					Y.Assert.isObject( model.get( attributeName ), attributeName + "'s value should have the value set by set() (object)." );
					
					model.set( attributeName, [] );
					Y.Assert.isArray( model.get( attributeName ), attributeName + "'s value should have the value set by set() (array)." );
				},
				
				
				"set() should accept all datatypes including falsy values" : function() {
					var model = new this.TestModel();
					
					this.assertAttributeAcceptsAll( model, 'attribute1' );
				},
				
				"set() should accept all datatypes, and still work even with a default value" : function() {
					// Test with regular values, given a default value
					var model = new this.TestModel();
					
					this.assertAttributeAcceptsAll( model, 'attribute2' );  // attribute2 has a default value
				},
				
				"set() should accept all datatypes, and still work even with a given value" : function() {
					// Test with regular values, given a default value
					var model = new this.TestModel( {
						attribute2 : "initial value"
					} );
					
					this.assertAttributeAcceptsAll( model, 'attribute2' );  // attribute2 has a given value in this test ("initial value")
				},
				
				
				// ------------------------
				
				
				"After the successful set() of an attribute, the Model should be considered modified" : function() {
					var TestModel = Model.extend( {
						attributes: [ 'attribute1' ]
					} );
					var model = new TestModel();
					
					Y.Assert.isFalse( model.isModified(), "Initially, the model should not be considered modified" );
					
					model.set( 'attribute1', 'value1' );
					Y.Assert.isTrue( model.isModified(), "After a set, the model should now be considered modified" );
				},
				
				
				"After a set() of an attribute to the same value from a clean state, the Model should NOT be considered modified (as the value didn't change)" : function() {
					var TestModel = Model.extend( {
						attributes: [ 'attribute1' ]
					} );
					var model = new TestModel( { attribute1: 'value1' } );  // initial data, model not considered modified
					
					Y.Assert.isFalse( model.isModified(), "Initially, the model should not be considered modified" );
					
					// Set to the same value
					model.set( 'attribute1', 'value1' );
					Y.Assert.isFalse( model.isModified(), "After a set to the *same value*, the model should not be considered modified (as the value didn't change)" );
				},
				
				
				// ------------------------
				
				
				"set() should not re-set an attribute to the same value from the initial value provided to the constructor" : function() {
					var changeCount = 0;
					
					var TestModel = Model.extend( {
						attributes: [ 'attribute1' ]
					} );
					
					var model = new TestModel( { attribute1: 'value1' } );
					model.addListener( 'change:attribute1', function() { changeCount++; } );
					
					// Set to the same value
					model.set( 'attribute1', 'value1' );
					Y.Assert.areSame( 0, changeCount, "The attribute should not have been registered as 'changed' when providing the same value" );
				},
				
				
				"set() should not re-set an attribute to the same value" : function() {
					var changeCount = 0;
					
					var TestModel = Model.extend( {
						attributes: [ 'attribute1' ]
					} );
					
					var model = new TestModel();
					model.addListener( 'change:attribute1', function() { changeCount++; } );
					
					// Set for the first time
					model.set( 'attribute1', 'value1' );
					Y.Assert.areSame( 1, changeCount, "Initially, the attribute should have been changed exactly once." );
					
					// Set the second time to the same value
					model.set( 'attribute1', 'value1' );
					Y.Assert.areSame( 1, changeCount, "The attribute should not have been registered as 'changed' the second time. Should still only have '1 change'." );
				},
				
				
				// ------------------------------
				
				
				// Test set() with Attribute-specific set() functions			
				
				"set() should run the Attribute's set() method on an attribute that has initial data of its own" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', set : function( newValue ) { return newValue + " " + this.get( 'attribute1' ); } }
						]
					} );
					var model = new TestModel( {
						attribute1 : "attribute1val",
						attribute2 : "attribute2val"
					} );
					
					Y.Assert.areSame( "attribute2val attribute1val", model.get( 'attribute2' ), "attribute2 should be the concatenation of its own value, a space, and attribute1" );
				},
				
				
				"set() should convert an attribute with a 'set' function when it is set() again" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', set : function( newValue ) { return newValue + " " + this.get( 'attribute1' ); } }
						]
					} );
					var model = new TestModel( {
						attribute1 : "attribute1val",
						attribute2 : "attribute2val"
					} );
					
					// This call should cause attribute2's set() function to run
					model.set( 'attribute2', "newattribute2value" );
					
					Y.Assert.areSame( "newattribute2value attribute1val", model.get( 'attribute2' ), "attribute2 should be the concatenation of its own value, a space, and attribute2" );
				},
				
				
				"When set() is provided an Object (hashmap) of data to set, the attributes with user-provided 'set' methods should be run after ones with out any (in case they rely on the ones without setters)" : function() {
					var TestModel = Model.extend( {
						attributes : [
							{ name: 'attr_with_setter1', set: function( value ) { return this.get( 'attr_without_setter' ) + value; } },
							{ name: 'attr_without_setter' },
							{ name: 'attr_with_setter2', set: function( value ) { return this.get( 'attr_without_setter' ) + value; } }
						]
					} );
					
					var model = new TestModel();
					model.set( {
						attr_with_setter1: 1,
						attr_without_setter: 2,
						attr_with_setter2: 3
					} );
					
					Y.Assert.areSame( 3, model.get( 'attr_with_setter1' ), "The value should have been added from the attr_without_setter" );
					Y.Assert.areSame( 2, model.get( 'attr_without_setter' ), "The value should have been simply provided to attr_without_setter" );
					Y.Assert.areSame( 5, model.get( 'attr_with_setter2' ), "The value should have been added from the attr_without_setter" );
				},
				 
				
				// ------------------------
				
				
				// Test delegation to the Attribute's beforeSet() and afterSet() methods
				
				"set() should delegate to the Attribute's beforeSet() and afterSet() methods to do any pre and post processing needed for the value" : function() {
					var beforeSetValue, 
					    afterSetValue;
					
					var TestAttribute = Attribute.extend( {
						beforeSet : function( model, newValue, oldValue ) {
							return ( beforeSetValue = newValue + 1 );
						},
						afterSet : function( model, newValue ) {
							return ( afterSetValue = newValue + 20 );
						}
					} );
					
					var TestModel = Model.extend( {
						attributes : [
							new TestAttribute( {
								name : 'attr1',
								
								// A custom 'set' function that should be executed in between the beforeSet() and afterSet() methods
								set : function( value ) {
									return value + 5;
								}
							} )
						]
					} );
					
					var model = new TestModel( { attr1: 0 } );
					
					Y.Assert.areSame( 1, beforeSetValue );
					Y.Assert.areSame( 26, afterSetValue );
				},
				
				
				
				// ------------------------
				
				// Test the 'change' event
				
				"When an attribute is set, a generalized 'change' event should be fired" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 'attribute1', 'attribute2' ]
					} );
					var model = new TestModel(),
					    changeEventFired = false,
					    attributeNameChanged,
					    newValue,
					    oldValue;
					    
					model.addListener( 'change', function( model, attributeName, _newValue, _oldValue ) {
						changeEventFired = true;
						attributeNameChanged = attributeName;
						newValue = _newValue;
						oldValue = _oldValue;
					} );
					
					model.set( 'attribute2', "brandNewValue" );
					Y.Assert.isTrue( changeEventFired, "The 'change' event was not fired" );
					Y.Assert.areSame( "attribute2", attributeNameChanged, "The attributeName that was changed was not provided to the event correctly." );
					Y.Assert.areSame( "brandNewValue", newValue, "The value for attribute2 that was changed was not provided to the event correctly." );
					Y.Assert.isUndefined( oldValue, "The oldValue for attribute2 that was changed was not provided to the event correctly. Should have been undefined, from having no original value" );
				},
				
				
				"When an attribute is set, a 'change:xxx' event should be fired for the changed attribute" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 'attribute1', 'attribute2' ]
					} );
					var model = new TestModel(),
					    changeEventFired = false,
					    newValue,
					    oldValue;
					    
					model.addListener( 'change:attribute2', function( model, _newValue, _oldValue ) {
						changeEventFired = true;
						newValue = _newValue;
						oldValue = _oldValue;
					} );
					
					model.set( 'attribute2', "brandNewValue" );
					Y.Assert.isTrue( changeEventFired, "The 'change:attribute2' event was not fired" );
					Y.Assert.areSame( "brandNewValue", newValue, "The value for attribute2 that was changed was not provided to the event correctly." );
					Y.Assert.isUndefined( oldValue, "The oldValue for attribute2 that was changed was not provided to the event correctly. Should have been undefined, from having no original value" );
				},
				
				
				"When an attribute with a `set()` function of its own is set, the 'change' events should be fired" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 
							{ 
								// Attribute with a set() function that returns a new value
								name : 'attribute1',
								set : function( value ) { 
									return value;
								}
							},
							{ 
								// Attribute with a set() function that does not return a new value (presumably modifying some other Attribute in the model),
								// and therefore does not have a new value set to the underlying data
								name : 'attribute2', 
								set : function( value ) {
									// Presumably updating some other Attribute in the model
								}
							} 
						]
					} );
					
					var model = new TestModel(),
					    attribute1ChangeEventCount = 0,
					    attribute1ChangeEventValue,
					    attribute2ChangeEventCount = 0,
					    attribute2ChangeEventValue;
					    
					model.addListener( 'change:attribute1', function( model, value ) {
						attribute1ChangeEventCount++;
						attribute1ChangeEventValue = value;
					} );
					model.addListener( 'change:attribute2', function( model, value ) {
						attribute2ChangeEventCount++;
						attribute2ChangeEventValue = value;
					} );
					
					
					// Test changing the attribute with a set() function that returns a new value
					model.set( 'attribute1', 'attribute1value1' );
					Y.Assert.areSame( 1, attribute1ChangeEventCount, "The attribute1 change event count should now be 1, with the initial value" );
					Y.Assert.areSame( 0, attribute2ChangeEventCount, "The attribute2 change event count should still be 0, as no set has been performed on it yet" );
					Y.Assert.areSame( 'attribute1value1', attribute1ChangeEventValue, "The attribute1 change event value was not correct" );
					
					model.set( 'attribute1', 'attribute1value2' );
					Y.Assert.areSame( 2, attribute1ChangeEventCount, "The attribute1 change event count should now be 2, with a new value" );
					Y.Assert.areSame( 0, attribute2ChangeEventCount, "The attribute2 change event count should still be 0, as no set has been performed on it yet" );
					Y.Assert.areSame( 'attribute1value2', attribute1ChangeEventValue, "The attribute1 change event value was not correct" );
					
					model.set( 'attribute1', 'attribute1value2' );  // setting to the SAME value, to make sure a new 'change' event has not been fired
					Y.Assert.areSame( 2, attribute1ChangeEventCount, "The attribute1 change event count should still be 2, being set to the same value" );
					Y.Assert.areSame( 0, attribute2ChangeEventCount, "The attribute2 change event count should still be 0, as no set has been performed on it yet" );
					
					
					// Test changing the attribute with a set() function that does *not* return a new value (which makes the model not store
					// any new value on its underlying data hash)
					model.set( 'attribute2', 'attribute2value1' );
					Y.Assert.areSame( 2, attribute1ChangeEventCount, "The attribute1 change event count should still be 2, as no new set has been performed on it" );
					Y.Assert.areSame( 1, attribute2ChangeEventCount, "The attribute2 change event count should now be 1, since a set has been performed on it" );
					Y.Assert.isUndefined( attribute2ChangeEventValue, "The attribute2 change event value should have been undefined, as its set() function does not return anything" );
					
					model.set( 'attribute2', 'attribute2value2' );
					Y.Assert.areSame( 2, attribute1ChangeEventCount, "The attribute1 change event count should still be 2, as no new set has been performed on it (2nd time)" );
					Y.Assert.areSame( 2, attribute2ChangeEventCount, "The attribute2 change event count should now be 2, since a set has been performed on it" );
					Y.Assert.isUndefined( attribute2ChangeEventValue, "The attribute2 change event value should still be undefined, as its set() function does not return anything" );				
				},
				
				
				"When an attribute with only a `get()` function is set, the 'change' events should be fired with the value from the get function, not the raw value (for both the newValue, and oldValue)" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [
							{
								name : 'myAttribute',
								get : function( value ) { return value + 10; } // add 10, to make sure we're using the getter
							}
						]
					} );
					
					var model = new TestModel( { myAttribute: 10 } ),
					    changeEventNewValue,
					    changeEventOldValue,
					    attributeSpecificChangeEventNewValue,
					    attributeSpecificChangeEventOldValue;
					
					model.on( {
						'change' : function( model, attributeName, newValue, oldValue ) {
							changeEventNewValue = newValue;
							changeEventOldValue = oldValue;
						},
						'change:myAttribute' : function( model, newValue, oldValue ) {
							attributeSpecificChangeEventNewValue = newValue;
							attributeSpecificChangeEventOldValue = oldValue;
						}
					} );
					
					model.set( 'myAttribute', 42 );  // the `get()` function on the Attribute will add 10 to this value when the attribute is retrieved
					
					Y.Assert.areSame( 52, changeEventNewValue, "The newValue provided with the change event should have come from myAttribute's `get()` function" );
					Y.Assert.areSame( 20, changeEventOldValue, "The oldValue provided with the change event should have come from myAttribute's `get()` function" );
					Y.Assert.areSame( 52, attributeSpecificChangeEventNewValue, "The newValue provided with the attribute-specific change event should have come from myAttribute's `get()` function" );
					Y.Assert.areSame( 20, attributeSpecificChangeEventOldValue, "The oldValue provided with the attribute-specific change event should have come from myAttribute's `get()` function" );
				},
				
				
				"When an attribute with both a `set()` function, and `get()` function of its own is set, the 'change' events should be fired with the value from the `get()` function, not the raw value" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 
							'baseAttribute',
							{
								// Computed Attribute with both a set() function and a get() function, which simply uses 'baseAttribute' for its value
								// (which in practice, would probably be composed of two or more attributes, and possible does calculations as well)
								name : 'computedAttribute',
								set : function( value ) { this.set( 'baseAttribute', value ); },
								get : function( value ) { return this.get( 'baseAttribute' ) + 10; }   // add 10, to make sure we're using the getter
							}
						]
					} );
					
					var model = new TestModel( { baseAttribute: 10 } ),
					    changeEventNewValue,
					    changeEventOldValue,
					    attributeSpecificChangeEventNewValue,
					    attributeSpecificChangeEventOldValue;
					
					model.on( {
						'change' : function( model, attributeName, newValue, oldValue ) {
							changeEventNewValue = newValue;
							changeEventOldValue = oldValue;
						},
						'change:computedAttribute' : function( model, newValue, oldValue ) {
							attributeSpecificChangeEventNewValue = newValue;
							attributeSpecificChangeEventOldValue = oldValue;
						}
					} );
					
					model.set( 'computedAttribute', 42 );  // the `get()` function will add 10 to this value when the attribute is retrieved
									
					
					Y.Assert.areSame( 52, changeEventNewValue, "The newValue provided with the change event should have come from computedAttribute's `get()` function" );
					Y.Assert.areSame( 20, changeEventOldValue, "The oldValue provided with the change event should have come from computedAttribute's `get()` function" );
					Y.Assert.areSame( 52, attributeSpecificChangeEventNewValue, "The newValue provided with the attribute-specific change event should have come from computedAttribute's `get()` function" );
					Y.Assert.areSame( 20, attributeSpecificChangeEventOldValue, "The oldValue provided with the attribute-specific change event should have come from computedAttribute's `get()` function" );
				},
				
				
				// ------------------------
				
				// Test the 'changeset' event
				
				"When multiple attributes are set, a generalized 'changeset' event should be fired exactly once" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [
							'a',
							'b',
							'c',
							'unModifiedAttr'
						]
					} );
					var model = new TestModel( { 'a': 1, 'b': 2, 'c': 3 } ),
					    changeSetEventCount = 0,
					    changeSetNewValues,
					    changeSetOldValues;
					
					// Check the initial 'a', 'b', and 'c' values
					Y.Assert.areSame( 1, model.get( 'a' ), "initial value for a" );
					Y.Assert.areSame( 2, model.get( 'b' ), "initial value for b" );
					Y.Assert.areSame( 3, model.get( 'c' ), "initial value for c" );
					    
					model.addListener( 'changeset', function( model, newValues, oldValues ) {
						changeSetEventCount++;
						changeSetNewValues = newValues;
						changeSetOldValues = oldValues;
					} );
					
					// Modify attr1, attr2, and attr3
					model.set( { 'a': 11, 'b': 22, 'c': 33 } );
					Y.Assert.areSame( 1, changeSetEventCount, "The 'changeset' event should have been fired exactly once" );
					
					Y.Assert.areSame( 3, _.keys( changeSetNewValues ).length, "The changeset's newValues should have exactly 3 properties" );
					Y.Assert.areSame( 3, _.keys( changeSetOldValues ).length, "The changeset's oldValues should have exactly 3 properties" );
					
					Y.Assert.areSame( 11, changeSetNewValues.a, "newValue for 'a'" );
					Y.Assert.areSame( 22, changeSetNewValues.b, "newValue for 'b'" );
					Y.Assert.areSame( 33, changeSetNewValues.c, "newValue for 'c'" );
					
					Y.Assert.areSame( 1, changeSetOldValues.a, "oldValue for 'a'" );
					Y.Assert.areSame( 2, changeSetOldValues.b, "oldValue for 'b'" );
					Y.Assert.areSame( 3, changeSetOldValues.c, "oldValue for 'c'" );
				},
				
				
				"When a computed attribute changes other attributes, the generalized 'changeset' event should still be only fired exactly once" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 
							{ 
								name : 'a', 
								set : function( value ) {
									this.set( 'b', value + 1 );
									this.set( 'c', value + 2 );
									return value;
								}
							}, 
							{ name : 'b' },
							{ name : 'c' },
							{ name : 'unModifiedAttr' }
						]
					} );
					var model = new TestModel( { 'a': 1 } ),  // setting 'a' will set 'b' and 'c'
					    changeSetEventCount = 0,
					    changeSetNewValues,
					    changeSetOldValues;
					
					// Check the initial 'a', 'b', and 'c' values
					Y.Assert.areSame( 1, model.get( 'a' ), "initial value for a" );
					Y.Assert.areSame( 2, model.get( 'b' ), "initial value for b. Should be set by the 'a' attribute's setter" );
					Y.Assert.areSame( 3, model.get( 'c' ), "initial value for c. Should be set by the 'a' attribute's setter" );
					
					model.addListener( 'changeset', function( model, newValues, oldValues ) {
						changeSetEventCount++;
						changeSetNewValues = newValues;
						changeSetOldValues = oldValues;
					} );
					
					model.set( 'a', 11 );
					Y.Assert.areSame( 1, changeSetEventCount, "The 'changeset' event should have been fired exactly once" );
					
					// Double check the 'a', 'b', and 'c' attributes have been changed
					Y.Assert.areSame( 11, model.get( 'a' ) );
					Y.Assert.areSame( 12, model.get( 'b' ) );
					Y.Assert.areSame( 13, model.get( 'c' ) );
					
					Y.Assert.areSame( 3, _.keys( changeSetNewValues ).length, "The changeset's newValues should have exactly 3 properties" );
					Y.Assert.areSame( 3, _.keys( changeSetOldValues ).length, "The changeset's oldValues should have exactly 3 properties" );
					
					Y.Assert.areSame( 11, changeSetNewValues.a, "newValue for 'a'" );
					Y.Assert.areSame( 12, changeSetNewValues.b, "newValue for 'b'" );
					Y.Assert.areSame( 13, changeSetNewValues.c, "newValue for 'c'" );
					
					Y.Assert.areSame( 1, changeSetOldValues.a, "oldValue for 'a'" );
					Y.Assert.areSame( 2, changeSetOldValues.b, "oldValue for 'b'" );
					Y.Assert.areSame( 3, changeSetOldValues.c, "oldValue for 'c'" );
				},
				
				
				"When an attribute changes, and a handler of the change ends up setting other attributes, the generalized 'changeset' event should still be only fired exactly once" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 
							{ name : 'a' }, 
							{ name : 'b' },
							{ name : 'c' },
							{ name : 'unModifiedAttr' }
						]
					} );
					var model = new TestModel( { 'a': 1, 'b': 2, 'c': 3 } ),
					    changeSetEventCount = 0,
					    changeSetNewValues,
					    changeSetOldValues;
					
					// Check the initial 'a', 'b', and 'c' values
					Y.Assert.areSame( 1, model.get( 'a' ), "initial value for a" );
					Y.Assert.areSame( 2, model.get( 'b' ), "initial value for b" );
					Y.Assert.areSame( 3, model.get( 'c' ), "initial value for c" );
					
					// Add a 'change' listener which sets other attributes on the model
					model.addListener( 'change:a', function( model, newValue, oldValue ) {
						model.set( 'b', 22 );
						model.set( 'c', 33 );
					} );
					
					// Now add the 'changeset' listener for the results of the test
					model.addListener( 'changeset', function( model, newValues, oldValues ) {
						changeSetEventCount++;
						changeSetNewValues = newValues;
						changeSetOldValues = oldValues;
					} );
					
					model.set( 'a', 11 );
					Y.Assert.areSame( 1, changeSetEventCount, "The 'changeset' event should have been fired exactly once" );
					
					// Double check the 'a', 'b', and 'c' attributes have been changed
					Y.Assert.areSame( 11, model.get( 'a' ) );
					Y.Assert.areSame( 22, model.get( 'b' ) );
					Y.Assert.areSame( 33, model.get( 'c' ) );
					
					Y.Assert.areSame( 3, _.keys( changeSetNewValues ).length, "The changeset's newValues should have exactly 3 properties" );
					Y.Assert.areSame( 3, _.keys( changeSetOldValues ).length, "The changeset's oldValues should have exactly 3 properties" );
					
					Y.Assert.areSame( 11, changeSetNewValues.a, "newValue for 'a'" );
					Y.Assert.areSame( 22, changeSetNewValues.b, "newValue for 'b'" );
					Y.Assert.areSame( 33, changeSetNewValues.c, "newValue for 'c'" );
					
					Y.Assert.areSame( 1, changeSetOldValues.a, "oldValue for 'a'" );
					Y.Assert.areSame( 2, changeSetOldValues.b, "oldValue for 'b'" );
					Y.Assert.areSame( 3, changeSetOldValues.c, "oldValue for 'c'" );
				},
				
				
				"When an attribute is changed multiple times within a single 'changeset', its oldValue value should have its *original* value (not any intermediate values)" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 
							{ name : 'a' }
						]
					} );
					var model = new TestModel( { 'a': 1 } ),
					    changeSetEventCount = 0,
					    changeSetNewValues,
					    changeSetOldValues;
					
					// Check the initial 'a' value
					Y.Assert.areSame( 1, model.get( 'a' ), "initial value for a" );
					
					// Add a 'change' listener which sets other attributes on the model
					// Note that this event handler only happens once, so it doesn't get recursively called from the extra sets to 'a'
					model.addListener( 'change:a', function( model, newValue, oldValue ) {
						model.set( 'a', 3 );
						model.set( 'a', 4 );
					}, this, { single: true } );
					
					// Now add the 'changeset' listener for the results of the test
					model.addListener( 'changeset', function( model, newValues, oldValues ) {
						changeSetEventCount++;
						changeSetNewValues = newValues;
						changeSetOldValues = oldValues;
					} );
					
					model.set( 'a', 2 );  // will eventually result in 'a' getting set to 4
					Y.Assert.areSame( 1, changeSetEventCount, "The 'changeset' event should have been fired exactly once" );
					
					// Double check the 'a' attribute has been changed to the last set value
					Y.Assert.areSame( 4, model.get( 'a' ) );
					
					Y.Assert.areSame( 1, _.keys( changeSetNewValues ).length, "The changeset's newValues should have exactly 1 property" );
					Y.Assert.areSame( 1, _.keys( changeSetOldValues ).length, "The changeset's oldValues should have exactly 1 property" );
					
					Y.Assert.areSame( 4, changeSetNewValues.a, "newValue for 'a'" );
					Y.Assert.areSame( 1, changeSetOldValues.a, "oldValue for 'a'" );
				},
				
				
				"multiple 'changeset' events should work correctly, providing the correct newValues and oldValues each time" : function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 
							{ name : 'a' }, 
							{ name : 'b' },
							{ name : 'c' },
							{ name : 'unModifiedAttr' }
						]
					} );
					var model = new TestModel( { 'a': 1, 'b': 2, 'c': 3 } ),
					    changeSetEventCount = 0,
					    changeSetNewValues,
					    changeSetOldValues;
					
					// Check the initial 'a', 'b', and 'c' values
					Y.Assert.areSame( 1, model.get( 'a' ), "initial value for a" );
					Y.Assert.areSame( 2, model.get( 'b' ), "initial value for b" );
					Y.Assert.areSame( 3, model.get( 'c' ), "initial value for c" );
					
					// Now add the 'changeset' listener for the results of the test
					model.addListener( 'changeset', function( model, newValues, oldValues ) {
						changeSetEventCount++;
						changeSetNewValues = newValues;
						changeSetOldValues = oldValues;
					} );
					
					model.set( { 'a': 11, 'b': 22, 'c': 33 } );
					Y.Assert.areSame( 1, changeSetEventCount, "The 'changeset' event should have been fired exactly once" );
					
					// Double check the 'a', 'b', and 'c' attributes have been changed
					Y.Assert.areSame( 11, model.get( 'a' ) );
					Y.Assert.areSame( 22, model.get( 'b' ) );
					Y.Assert.areSame( 33, model.get( 'c' ) );
					
					Y.Assert.areSame( 3, _.keys( changeSetNewValues ).length, "The changeset's newValues should have exactly 3 properties" );
					Y.Assert.areSame( 3, _.keys( changeSetOldValues ).length, "The changeset's oldValues should have exactly 3 properties" );
					
					Y.Assert.areSame( 11, changeSetNewValues.a, "newValue for 'a'" );
					Y.Assert.areSame( 22, changeSetNewValues.b, "newValue for 'b'" );
					Y.Assert.areSame( 33, changeSetNewValues.c, "newValue for 'c'" );
					
					Y.Assert.areSame( 1, changeSetOldValues.a, "oldValue for 'a'" );
					Y.Assert.areSame( 2, changeSetOldValues.b, "oldValue for 'b'" );
					Y.Assert.areSame( 3, changeSetOldValues.c, "oldValue for 'c'" );
					
					
					// Now just change 'b' and 'c' manually
					model.set( { 'b': 222, 'c': 333 } );
					Y.Assert.areSame( 2, changeSetEventCount, "The 'changeset' event should have been fired exactly twice at this point (one more than the last test)" );
					
					// Double check the 'b', and 'c' attributes have been changed (and that 'a' hasn't)
					Y.Assert.areSame( 11, model.get( 'a' ) );
					Y.Assert.areSame( 222, model.get( 'b' ) );
					Y.Assert.areSame( 333, model.get( 'c' ) );
					
					Y.Assert.areSame( 2, _.keys( changeSetNewValues ).length, "The changeset's newValues should have exactly 2 properties" );
					Y.Assert.areSame( 2, _.keys( changeSetOldValues ).length, "The changeset's oldValues should have exactly 2 properties" );
					
					Y.Assert.areSame( 222, changeSetNewValues.b, "newValue for 'b'" );
					Y.Assert.areSame( 333, changeSetNewValues.c, "newValue for 'c'" );
					
					Y.Assert.areSame( 22, changeSetOldValues.b, "oldValue for 'b'" );
					Y.Assert.areSame( 33, changeSetOldValues.c, "oldValue for 'c'" );
				},
				
				
				// ------------------------
				
				
				// Test Backbone Collection compatibility
				
				"for compatibility with Backbone's Collection, set() should set the id property to the Model object itself with the idAttribute is changed" : function() {
					var TestModel = Model.extend( {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', set : function( value ) { return value + " " + this.get( 'attribute1' ); } }
						],
						idAttribute: 'attribute1'
					} );
					
					var model = new TestModel( {
						attribute1 : "attribute1val",
						attribute2 : "attribute2val"
					} );
					
					Y.Assert.areSame( 'attribute1val', model.id, "The model's `id` property should have been set to attribute1's value, as that is the idAttribute." );
					
					model.set( 'attribute1', 'newValue' );
					Y.Assert.areSame( 'newValue', model.id, "The model's `id` property should have been set to attribute1's value after another set(), as that is the idAttribute." );
				}
			},
			
			
			
			{
				/*
				 * Test get()
				 */
				name: 'Test get()',
		
		
				setUp : function() {
					this.TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', defaultValue: "attribute2's default" },
							{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
							{ name: 'attribute4', set : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } },
							{ name: 'attribute5', get : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } }
						]
					} );
				},
				
				
				"running get() on an attribute with no initial value and no default value should return undefined" : function() {
					var model = new this.TestModel();
					Y.Assert.isUndefined( model.get( 'attribute1' ) );  // attribute1 has no default value
				},
				
				"running get() on an attribute with an initial value and no default value should return the initial value" : function() {
					var model = new this.TestModel( {
						attribute1 : "initial value"
					} );
					Y.Assert.areSame( "initial value", model.get( 'attribute1' ) );  // attribute1 has no default value
				},
				
				"running get() on an attribute with no initial value but does have a default value should return the default value" : function() {
					var model = new this.TestModel();
					Y.Assert.areSame( "attribute2's default", model.get( 'attribute2' ) );  // attribute2 has a default value
				},
				
				"running get() on an attribute with an initial value and a default value should return the initial value" : function() {
					var model = new this.TestModel( {
						attribute2 : "initial value"
					} );
					Y.Assert.areSame( "initial value", model.get( 'attribute2' ) );  // attribute2 has a default value
				},
				
				"running get() on an attribute with no initial value but does have a default value which is a function should return the default value" : function() {
					var model = new this.TestModel();
					Y.Assert.areSame( "attribute3's default", model.get( 'attribute3' ) );  // attribute3 has a defaultValue that is a function
				},
				
				"running get() on an attribute with a `get` function defined should return the value that the `get` function returns" : function() {
					var model = new this.TestModel( { attribute1: 'value1' } );
					Y.Assert.areSame( "value1 attribute2's default", model.get( 'attribute5' ) );
				}
			},
			
			
			{
				/*
				 * Test raw()
				 */
				name: 'Test raw()',
		
		
				setUp : function() {
					this.TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', defaultValue: "attribute2's default" },
							{ 
								name: 'attribute3', 
								get : function( newValue ) { 
									return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); 
								} 
							},
							{ 
								name: 'attribute4', 
								raw : function( newValue ) { 
									return newValue + " " + this.get( 'attribute1' );
								} 
							}
						]
					} );
				},
				
				
				"running raw() on an attribute with no initial value and no default value should return undefined" : function() {
					var model = new this.TestModel();
					Y.Assert.isUndefined( model.raw( 'attribute1' ) );  // attribute1 has no default value
				},
				
				"running raw() on an attribute with an initial value and no default value should return the initial value" : function() {
					var model = new this.TestModel( {
						attribute1 : "initial value"
					} );
					Y.Assert.areSame( "initial value", model.raw( 'attribute1' ) );  // attribute1 has no default value
				},
				
				"running raw() on an attribute with no initial value but does have a default value should return the default value" : function() {
					var model = new this.TestModel();
					Y.Assert.areSame( "attribute2's default", model.raw( 'attribute2' ) );  // attribute2 has a default value
				},
				
				"running raw() on an attribute with a `get` function defined should return the *underlying* value, not the value that the `get` function returns" : function() {
					var model = new this.TestModel( { attribute3: 'value1' } );
					Y.Assert.areSame( "value1", model.raw( 'attribute3' ) );
				},
				
				"running raw() on an attribute with a `raw` function defined should return the value that the `raw` function returns" : function() {
					var model = new this.TestModel( { 
						attribute1: 'value1',
						attribute4: 'value4'
					} );
					Y.Assert.areSame( "value4 value1", model.raw( 'attribute4' ) );
				}
			},
			
			
			{
				/*
				 * Test getDefault()
				 */
				name: 'Test getDefault()',
		
		
				setUp : function() {
					this.TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', defaultValue: "attribute2's default" },
							{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
							{ name: 'attribute4', set : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } },
							{ name: 'attribute5', set : function( newValue ) { return newValue + " " + this.get( 'attribute2' ); } }
						]
					} );
				},
				
				
				// Test that the default values of attributes can be retrieved
				
				"A attribute with no defaultValue should return undefined when trying to retrieve its default value" : function() {
					var model = new this.TestModel();
					Y.Assert.isUndefined( model.getDefault( 'attribute1' ) );  // attribute1 has no default value
				},
				
				"A defaultValue should be able to be retrieved directly when the attribute has one" : function() {
					var model = new this.TestModel();
					Y.Assert.areSame( "attribute2's default", model.getDefault( 'attribute2' ) );  // attribute2 has a defaultValue of a string
				},
				
				"A defaultValue should be able to be retrieved directly when the defaultValue is a function that returns its default" : function() {
					var model = new this.TestModel();
					Y.Assert.areSame( "attribute3's default", model.getDefault( 'attribute3' ) );  // attribute2 has a defaultValue that is a function that returns a string
				}
			},	
				
			
			
			// ------------------------
			
			
			{
				/*
				 * Test onEmbeddedDataComponentChange()
				 */
				name : "Test onEmbeddedDataComponentChange()",
				
				"onEmbeddedDataComponentChange() should " : function() {
					
				}
			},
			
			
			
			
			// ------------------------
			
			
			{
				/*
				 * Test isModified()
				 */
				name: 'Test isModified()',
		
		
				setUp : function() {
					this.TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', defaultValue: "attribute2's default" },
							{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
							{ name: 'attribute4', set : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } },
							{ name: 'attribute5', set : function( newValue ) { return newValue + " " + this.get( 'attribute2' ); } }
						]
					} );
					
					this.ConcreteDataComponentAttribute = DataComponentAttribute.extend( {} );
					
					this.ConcreteDataComponent = DataComponent.extend( {
						// Implementation of abstract interface
						getData : Data.emptyFn,
						isModified : Data.emptyFn,
						commit : Data.emptyFn,
						rollback : Data.emptyFn
					} );
				},
				
				// -------------------------------------
				
				// Test checking the model as a whole
				
				"isModified should return false if there are no changes on the model" : function() {
					var model = new this.TestModel();
					
					Y.Assert.isFalse( model.isModified() );
				},
				
				
				"isModified should return true if there is at least one change on the model" : function() {
					var model = new this.TestModel();
					model.set( 'attribute1', 'newValue1' );
					
					Y.Assert.isTrue( model.isModified() );
				},
				
				
				"isModified should return true if there are multiple changes on the model" : function() {
					var model = new this.TestModel();
					model.set( 'attribute1', 'newValue1' );
					model.set( 'attribute2', 'newValue2' );
					
					Y.Assert.isTrue( model.isModified() );
				},
				
				
				// -------------------------------------
				
				// Test checking particular attributes
				
				"isModified() should return false for particular attributes that have not been changed, even if there are other changes" : function() {
					var model = new this.TestModel();
					model.set( 'attribute3', 'testing123' );
					
					Y.Assert.isFalse( model.isModified( 'attribute1' ), "attribute1, with no defaultValue, should not be modified" );
					Y.Assert.isFalse( model.isModified( 'attribute2' ), "attribute2, with a defaultValue, should not be modified" );
				},
				
				
				"isModified() should return true for particular attributes that have been changed" : function() {
					var model = new this.TestModel();
					
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					Y.Assert.isTrue( model.isModified( 'attribute1' ), "attribute1 should be marked as modified" );
					Y.Assert.isTrue( model.isModified( 'attribute2' ), "attribute2 should be marked as modified" );
				},
				
				
				"isModified() should return false for particular attributes that have been changed, but then committed" : function() {
					var model = new this.TestModel();
					
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					model.commit();
					Y.Assert.isFalse( model.isModified( 'attribute1' ), "attribute1 should have been committed, and therefore not marked as modified" );
					Y.Assert.isFalse( model.isModified( 'attribute2' ), "attribute2 should have been committed, and therefore not marked as modified" );
				},
				
				
				"isModified() should return false for particular attributes that have been changed, but then rolled back" : function() {
					var model = new this.TestModel();
					
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					model.rollback();
					Y.Assert.isFalse( model.isModified( 'attribute1' ), "attribute1 should have been rolled back, and therefore not marked as modified" );
					Y.Assert.isFalse( model.isModified( 'attribute2' ), "attribute2 should have been rolled back, and therefore not marked as modified" );
				},
				
				
				// -------------------------
				
				// Test with embedded models/collections
				
				"In the case of embedded DataComponents, the parent model should be considered 'modified' when a child embedded DataComponent has changes" : function() {
					var ParentModel = Model.extend( {
						attributes : [
							new this.ConcreteDataComponentAttribute( { name: 'child', embedded: true } )
						]
					} );
					
					var childDataComponent = JsMockito.mock( this.ConcreteDataComponent );
					JsMockito.when( childDataComponent ).isModified().thenReturn( true );
					
					var parentModel = new ParentModel( {
						child: childDataComponent
					} );
					
					Y.Assert.isTrue( parentModel.isModified(), "The parent model should be considered 'modified' while its child model is 'modified'" );
					Y.Assert.isTrue( parentModel.isModified( 'child' ), "The 'child' attribute should be considered 'modified'" );
				},
				
				
				"The parent model should *not* have changes when a child model has changes, but is not 'embedded'" : function() {
					var ParentModel = Model.extend( {
						attributes : [
							new this.ConcreteDataComponentAttribute( { name: 'child', embedded: false } )  // note: NOT embedded
						]
					} );
					
					var childDataComponent = JsMockito.mock( this.ConcreteDataComponent );
					JsMockito.when( childDataComponent ).isModified().thenReturn( true );
					
					var parentModel = new ParentModel( {
						child: childDataComponent
					} );
					
					Y.Assert.isFalse( parentModel.isModified(), "The parent model should not be considered 'modified' even though its child model is 'modified', because the child is not 'embedded'" );
				},
				
				
				
				// -------------------------
				
				// Test with the 'persistedOnly' option set to true
				
				"If the persistedOnly option is provided as true, isModified() should return true only if a persisted attribute is modified" : function() {
					var MyModel = Model.extend( {
						attributes : [
							{ name : 'persistedAttr', type: 'string' },
							{ name : 'unpersistedAttr', type: 'string', persist: false }
						]
					} );
					
					var model = new MyModel();
					
					Y.Assert.isFalse( model.isModified(), "Initial condition: the model should not be considered modified" );
					
					model.set( 'unpersistedAttr', 'value1' );
					Y.Assert.isTrue( model.isModified(), "The model should be considered 'modified' in general" );
					Y.Assert.isFalse( model.isModified( { persistedOnly: true } ), "The model only has unpersisted attributes modified, so this call should return false" );
					
					model.set( 'persistedAttr', 'value1' );
					Y.Assert.isTrue( model.isModified(), "The model should still be considered 'modified' in general" );
					Y.Assert.isTrue( model.isModified( { persistedOnly: true } ), "The model now has a persisted attribute that is modified. This should return true." );
				},
				
				
				"If the persistedOnly option is provided as true and a specific attribute name is given, isModified() should return true only if the attribute is both modified, and persisted" : function() {
					var MyModel = Model.extend( {
						attributes : [
							{ name : 'persistedAttr', type: 'string' },
							{ name : 'unpersistedAttr', type: 'string', persist: false }
						]
					} );
					
					var model = new MyModel();
					
					Y.Assert.isFalse( model.isModified( 'persistedAttr' ), "Initial condition: the 'persistedAttr' should not be considered modified" );
					Y.Assert.isFalse( model.isModified( 'unpersistedAttr' ), "Initial condition: the 'unpersistedAttr' should not be considered modified" );
					
					model.set( 'unpersistedAttr', 'value1' );
					Y.Assert.isTrue( model.isModified( 'unpersistedAttr' ), "The 'unpersistedAttr' should be considered 'modified' in general" );
					Y.Assert.isFalse( model.isModified( 'unpersistedAttr', { persistedOnly: true } ), "The 'unpersistedAttr' is not persisted, so this call should return false, even though it has been changed" );
					
					model.set( 'persistedAttr', 'value1' );
					Y.Assert.isTrue( model.isModified( 'persistedAttr' ), "The 'persistedAttr' should still be considered 'modified' in general" );
					Y.Assert.isTrue( model.isModified( 'persistedAttr', { persistedOnly: true } ), "The 'persistedAttr' is both modified, and persisted. This should return true." );
				}
				
			},
			
			
			{
				/*
				 * Test getChanges()
				 */
				name: 'Test getChanges()',
				
				
				// NOTE: Ignoring test for now, since we can't swap out a mock NativeObjectConverter at this time
				_should : {
					ignore : {
						"getChanges() should delegate to the singleton NativeObjectConverter to create an Object representation of its data, but only provide changed attributes for the attributes that should be returned" : true
					}
				},
				
				setUp : function() {					
					this.ConcreteDataComponentAttribute = DataComponentAttribute.extend( {} );
					this.ConcreteDataComponent = Data.DataComponent.extend( { 
						// Implementation of abstract interface
						getData : Data.emptyFn,
						isModified : Data.emptyFn,
						commit : Data.emptyFn,
						rollback : Data.emptyFn
					} );
				},
				
				
				// ---------------------------
				
				
				"getChanges() should delegate to the singleton NativeObjectConverter to create an Object representation of its data, but only provide changed attributes for the attributes that should be returned" : function() {
					var MyModel = Model.extend( {
						attributes: [ 
							'attr1', 
							'attr2', 
							'attr3',
							new this.ConcreteDataComponentAttribute( { name: 'nestedDataComponent', embedded: false } ),  // this one NOT embedded
							new this.ConcreteDataComponentAttribute( { name: 'embeddedDataComponent', embedded: true } )  // this one IS embedded
						]
					} );
					
					
					var mockDataComponent = JsMockito.mock( this.ConcreteDataComponent );
					JsMockito.when( mockDataComponent ).isModified().thenReturn( true );
					
					var model = new MyModel( {
						attr1: 'value1',
						attr2: 'value2',
						attr3: 'value3',
						nestedDataComponent : mockDataComponent,
						embeddedDataComponent : mockDataComponent
					} );
					model.set( 'attr1', 'newValue1' );
					model.set( 'attr2', 'newValue2' );
					// Note: the mockDataComponent is always going to return true for its isModified() method, so no need to "change" it
					
					// even though there really is no result from this unit test with a mock object, this has the side effect of populating the test data
					var result = model.getChanges( { raw: true } );  // add an extra option to make sure it goes through
					
					var optionsProvidedToConvert = this.args[ 1 ];  // defined in the setUp method
					
					// Check that the correct arguments were provided to the NativeObjectConverter's convert() method
					Y.Assert.areSame( model, this.args[ 0 ], "The first arg provided to NativeObjectConverter::convert() should have been the model." );
					Y.Assert.areSame( true, optionsProvidedToConvert.raw, "The second arg provided to NativeObjectConverter::convert() should have receieved the 'raw:true' option" );
					Y.ArrayAssert.itemsAreSame( [ 'attr1', 'attr2', 'embeddedDataComponent' ], optionsProvidedToConvert.attributeNames, "The second arg provided to NativeObjectConverter::convert() should have receieved the 'attributeNames' option, with the attributes that were changed" );
				}
			},
			
			
			{
				/*
				 * Test commit()
				 */
				name: 'Test commit()',
		
		
				setUp : function() {
					this.TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', defaultValue: "attribute2's default" },
							{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
							{ name: 'attribute4', set : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } },
							{ name: 'attribute5', set : function( newValue ) { return newValue + " " + this.get( 'attribute2' ); } }
						]
					} );
					
					
					this.ConcreteDataComponent = DataComponent.extend( { 
						// Implementation of abstract interface
						getData : Data.emptyFn,
						isModified : Data.emptyFn,
						commit : Data.emptyFn,
						rollback : Data.emptyFn
					} );
				},
					
				
				"committing changed data should cause the model to no longer be considered modified, and cause getChanges() to return an empty object" : function() {
					var model = new this.TestModel();
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					model.commit();
					
					var changes = model.getChanges();
					Y.Assert.areSame( 0, _.keys( changes ).length, "The changes hash retrieved should have exactly 0 properties" );
					
					Y.Assert.isFalse( model.isModified(), "The model should no longer be considered modified" );
				},
				
				
				"committing changed data should cause rollback() to have no effect" : function() {
					var model = new this.TestModel();
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					model.commit();
					
					// Attempt a rollback, even though the data was committed. Should have no effect.
					model.rollback();
					Y.Assert.areSame( "new value 1", model.get( 'attribute1' ), "attribute1 should have been 'new value 1'. rollback() should not have had any effect." );
					Y.Assert.areSame( "new value 2", model.get( 'attribute2' ), "attribute2 should have been 'new value 2'. rollback() should not have had any effect." );
				},
				
				
				"committing changed data should fire the 'commit' event" : function() {
					var commitEventCount = 0;
					var model = new this.TestModel();
					model.addListener( 'commit', function() {
						commitEventCount++;
					} );
					
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					model.commit();
					
					Y.Assert.areSame( 1, commitEventCount, "The 'commit' event should have been fired exactly once after committing." );
				},
				
				
				// --------------------
				
				// Test with embedded DataComponents (Models and Collections)
				
				"committing a parent model should also commit any embedded child DataComponent that the model holds" : function() {
					// A concrete subclass for testing
					var ConcreteDataComponentAttribute = DataComponentAttribute.extend( {
						// Implementation of abstract interface
						getData : Data.emptyFn,
						isModified : Data.emptyFn,
						commit : Data.emptyFn,
						rollback : Data.emptyFn
					} );
					
					var MyModel = Model.extend( {
						attributes : [ new ConcreteDataComponentAttribute( { name: 'childDataComponent', embedded: true } ) ]
					} );
					
					var mockDataComponent = JsMockito.mock( this.ConcreteDataComponent );
					var model = new MyModel();
					
					model.set( 'childDataComponent', mockDataComponent );
					model.commit();
					
					try {
						JsMockito.verify( mockDataComponent ).commit();  // verify that this was called at least once
					} catch( ex ) {
						Y.Assert.fail( ex );  // those newbs throw strings for errors...
					}
				}
				
			},
			
			
			
			{
				/*
				 * Test rollback()
				 */
				name: 'Test rollback()',
		
		
				setUp : function() {
					this.TestModel = Class.extend( Model, {
						attributes: [
							{ name: 'attribute1' },
							{ name: 'attribute2', defaultValue: "attribute2's default" },
							{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
							{ name: 'attribute4', set : function( newValue ) { return this.get( 'attribute1' ) + " " + this.get( 'attribute2' ); } },
							{ name: 'attribute5', set : function( newValue ) { return newValue + " " + this.get( 'attribute2' ); } }
						]
					} );
				},
					
					
				"rollback() should revert the model's values back to default values if before any committed set() calls" : function() {
					// No initial data. 
					// attribute1 should be undefined
					// attribute2 should have the string "attribute2's default"
					var model = new this.TestModel();
					
					// Set, and then rollback
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					Y.Assert.isTrue( model.isModified(), "The model should be considered modified." );
					model.rollback();
					
					// Check that they have the original values
					Y.Assert.isUndefined( model.get( 'attribute1' ) );
					Y.Assert.areSame( "attribute2's default", model.get( 'attribute2' ) );
					
					// Check that isModified() returns false
					Y.Assert.isFalse( model.isModified(), "The model should no longer be considered modified after rollback." );
				},
				
				
				"rollback() should revert the model's values back to their pre-set() values" : function() {
					var model = new this.TestModel( {
						attribute1 : "original attribute1",
						attribute2 : "original attribute2"
					} );
					
					// Set, check if the model is considered modified, and then rollback
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					Y.Assert.isTrue( model.isModified(), "The model should be considered modified." );
					model.rollback();
					
					// Check that they have the original values
					Y.Assert.areSame( "original attribute1", model.get( 'attribute1' ) );
					Y.Assert.areSame( "original attribute2", model.get( 'attribute2' ) );
					
					// Check that isModified() returns false
					Y.Assert.isFalse( model.isModified(), "The model should no longer be considered modified after rollback." );
				},
				
				
				"rollback() should revert the model's values back to their pre-set() values, when more than one set() call is made" : function() {
					var model = new this.TestModel( {
						attribute1 : "original attribute1",
						attribute2 : "original attribute2"
					} );
					
					// Set twice, and then rollback
					model.set( 'attribute1', "new value 1" );
					model.set( 'attribute2', "new value 2" );
					model.set( 'attribute1', "new value 1 - even newer" );
					model.set( 'attribute2', "new value 2 - even newer" );
					Y.Assert.isTrue( model.isModified(), "The model should be considered modified." );
					model.rollback();
					
					// Check that they have the original values after rollback (that the 2nd set of set() calls didn't overwrite the original values) 
					Y.Assert.areSame( "original attribute1", model.get( 'attribute1' ) );
					Y.Assert.areSame( "original attribute2", model.get( 'attribute2' ) );
					
					// Check that isModified() returns false
					Y.Assert.isFalse( model.isModified(), "The model should no longer be considered modified after rollback." );
				},
				
				
				"rollback() should fire the 'rollback' event" : function() {
					var rollbackEventCount = 0;
					
					var model = new this.TestModel( {
						attribute1 : 'orig1',
						attribute2 : 'orig2'
					} );
					model.on( 'rollback', function() {
						rollbackEventCount++;
					} );
					
					
					model.set( 'attribute1', 'new1' );
					
					Y.Assert.areSame( 0, rollbackEventCount, "Initial condition: The rollback event should not have been fired yet" );
					model.rollback();
					Y.Assert.areSame( 1, rollbackEventCount, "The rollback event should have been fired exactly once" );
				}
				
			},
			
			
			
			{
				/*
				 * Test reload()
				 */
				name: 'Test reload()',
				
				setUp : function() {					
					this.proxy = JsMockito.mock( Proxy.extend( {
						// Implementation of abstract interface
						create : Data.emptyFn,
						read : Data.emptyFn,
						update : Data.emptyFn,
						destroy : Data.emptyFn
					} ) );
				},
			
				
				// Special instructions
				_should : {
					error : {
						"reload() should throw an error if there is no configured proxy" : 
							"Data.Model::reload() error: Cannot load. No proxy configured."
					}
				},
				
				
				"reload() should throw an error if there is no configured proxy" : function() {
					var MyModel = Model.extend( {
						attributes : [ 'id', 'name' ]
						// note: no configured proxy
					} );
					
					var model = new MyModel();
					model.reload();
					
					Y.Assert.fail( "reload() should have thrown an error with no configured proxy" );
				},
				
				
				"reload() should delegate to its proxy's read() method to retrieve the data" : function() {
					JsMockito.when( this.proxy ).read().thenReturn( new jQuery.Deferred().promise() );
					
					var MyModel = Model.extend( {
						attributes : [ 'id', 'name' ],
						proxy : this.proxy
					} );
					
					
					// Instantiate and run the reload() method to delegate
					var model = new MyModel( { id: 1 } ); 
					model.reload();
					
					try {
						JsMockito.verify( this.proxy ).read();
					} catch( msg ) {
						Y.Assert.fail( msg );
					}
				},
				
				
				"reload() should call its success/complete callbacks, and resolve its deferred with the arguments: model, operation" : function() {
					JsMockito.when( this.proxy ).read().then( function( operation ) {
						operation.setResultSet( new ResultSet( {
							records : [ { id: 1, name: "asdf" } ]
						} ) );
						return new jQuery.Deferred().resolve( operation ).promise();
					} );
					
					var MyModel = Model.extend( {
						attributes : [ 'id', 'name' ],
						proxy : this.proxy
					} );
					
					var successCallCount = 0,
					    errorCallCount = 0,
					    completeCallCount = 0,
					    doneCallCount = 0,
					    failCallCount = 0,
					    alwaysCallCount = 0;
					
					// Instantiate and run the reload() method to delegate
					var modelInstance = new MyModel( { id: 1 } ); 
					var promise = modelInstance.reload( {
						success : function( model, operation ) {
							successCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in success cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in success cb" );
						},
						error : function( model, operation ) {
							errorCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in error cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in error cb" );
						},
						complete : function( model, operation ) {
							completeCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in complete cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in complete cb" );
						}
					} )
						.done( function( model, operation ) {
							doneCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in done cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in done cb" );
						} )
						.fail( function( model, operation ) {
							failCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in fail cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in fail cb" );
						} )
						.always( function( model, operation ) {
							alwaysCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in always cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in always cb" );
						} );
					
					// Make sure the appropriate callbacks executed
					Y.Assert.areSame( 1, successCallCount, "successCallCount" );
					Y.Assert.areSame( 0, errorCallCount, "errorCallCount" );
					Y.Assert.areSame( 1, completeCallCount, "completeCallCount" );
					Y.Assert.areSame( 1, doneCallCount, "doneCallCount" );
					Y.Assert.areSame( 0, failCallCount, "failCallCount" );
					Y.Assert.areSame( 1, alwaysCallCount, "alwaysCallCount" );
				},
				
				
				"reload() should call its error/complete callbacks, and reject its deferred with the arguments: model, operation" : function() {
					JsMockito.when( this.proxy ).read().then( function( operation ) {
						return new jQuery.Deferred().reject( operation ).promise();
					} );
					
					var MyModel = Model.extend( {
						attributes : [ 'id', 'name' ],
						proxy : this.proxy
					} );
					
					var successCallCount = 0,
					    errorCallCount = 0,
					    completeCallCount = 0,
					    doneCallCount = 0,
					    failCallCount = 0,
					    alwaysCallCount = 0;
					
					// Instantiate and run the reload() method to delegate
					var modelInstance = new MyModel( { id: 1 } ); 
					var promise = modelInstance.reload( {
						success : function( model, operation ) {
							successCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in success cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in success cb" );
						},
						error : function( model, operation ) {
							errorCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in error cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in error cb" );
						},
						complete : function( model, operation ) {
							completeCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in complete cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in complete cb" );
						}
					} )
						.done( function( model, operation ) {
							doneCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in done cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in done cb" );
						} )
						.fail( function( model, operation ) {
							failCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in fail cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in fail cb" );
						} )
						.always( function( model, operation ) {
							alwaysCallCount++;
							Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in always cb" );
							Y.Assert.isInstanceOf( ReadOperation, operation, "ReadOperation should have been arg 2 in always cb" );
						} );
					
					// Make sure the appropriate callbacks executed
					Y.Assert.areSame( 0, successCallCount, "successCallCount" );
					Y.Assert.areSame( 1, errorCallCount, "errorCallCount" );
					Y.Assert.areSame( 1, completeCallCount, "completeCallCount" );
					Y.Assert.areSame( 0, doneCallCount, "doneCallCount" );
					Y.Assert.areSame( 1, failCallCount, "failCallCount" );
					Y.Assert.areSame( 1, alwaysCallCount, "alwaysCallCount" );
				}
			},
			
			
			{
				/*
				 * Test save()
				 */
				name: 'Test save()',
				ttype: 'testsuite',
				
				items : [
					{
						name : "General save() tests",
						
						setUp : function() {
							this.proxy = JsMockito.mock( Proxy.extend( {
								// Implementation of abstract interface
								create: Data.emptyFn,
								read: Data.emptyFn,
								update: Data.emptyFn,
								destroy: Data.emptyFn
							} ) );
						},
						
						
						// Special instructions
						_should : {
							error : {
								"save() should throw an error if there is no configured proxy" : 
									"Data.Model::save() error: Cannot save. No proxy."
							}
						},
						
						
						"save() should throw an error if there is no configured proxy" : function() {
							var MyModel = Model.extend( {
								// note: no proxy
							} );
							var model = new MyModel();
							model.save();
							Y.Assert.fail( "save() should have thrown an error with no configured proxy" );
						},
						
						
						"save() should delegate to its proxy's create() method to persist changes when the Model does not have an id set" : function() {
							var MyModel = Model.extend( {
								attributes : [ 'id' ],
								idAttribute : 'id',
								
								proxy : this.proxy
							} );
							
							var writeOperation = JsMockito.mock( WriteOperation );
							JsMockito.when( writeOperation ).getResultSet().thenReturn( new ResultSet( { records: [] } ) );
							JsMockito.when( this.proxy ).create().thenReturn( new jQuery.Deferred().resolve( writeOperation ).promise() );
							
							var model = new MyModel();  // note: no 'id' set
							
							// Run the save() method to delegate 
							model.save();
							
							try {
								JsMockito.verify( this.proxy ).create();
							} catch( msg ) {
								Y.Assert.fail( msg );
							}
						},
						
						
						"save() should delegate to its proxy's update() method to persist changes, when the Model has an id" : function() {
							var MyModel = Model.extend( {
								attributes : [ 'id' ],
								idAttribute : 'id',
								
								proxy : this.proxy
							} );
							
							var writeOperation = JsMockito.mock( WriteOperation );
							JsMockito.when( writeOperation ).getResultSet().thenReturn( new ResultSet( { records: [] } ) );
							JsMockito.when( this.proxy ).update().thenReturn( new jQuery.Deferred().resolve( writeOperation ).promise() );
							
							var model = new MyModel( { id: 1 } );
							
							// Run the save() method to delegate 
							model.save();
							
							try {
								JsMockito.verify( this.proxy ).update();
							} catch( msg ) {
								Y.Assert.fail( msg );
							}
						}
					},
						
					
					{
						name : "save() callbacks and promise tests",
						
						setUp : function() {
							this.proxy = JsMockito.mock( Proxy.extend( {
								// Implementation of abstract interface
								create: Data.emptyFn,
								read: Data.emptyFn,
								update: Data.emptyFn,
								destroy: Data.emptyFn
							} ) );
							
							this.operation = JsMockito.mock( WriteOperation );
							JsMockito.when( this.operation ).getResultSet().thenReturn( new ResultSet() );
							
							this.deferred = new jQuery.Deferred();
							
							this.Model = Model.extend( {
								attributes : [ 'id', 'attribute1' ],
								proxy  : this.proxy
							} );
						},
						
						
						// Callbacks Tests
						
						"save() should call its success/complete callbacks, and reject its deferred with the arguments (model, operation) if the proxy successfully 'create's" : function() {
							JsMockito.when( this.proxy ).create().then( function( operation ) {
								return new jQuery.Deferred().resolve( operation ).promise();
							} );
							
							var successCallCount = 0,
							    errorCallCount = 0,
							    completeCallCount = 0,
							    doneCallCount = 0,
							    failCallCount = 0,
							    alwaysCallCount = 0;
							
							// Instantiate and run the save() method
							var modelInstance = new this.Model(); 
							var promise = modelInstance.save( {
								success : function( model, operation ) {
									successCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in success cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in success cb" );
								},
								error : function( model, operation ) {
									errorCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in error cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in error cb" );
								},
								complete : function( model, operation ) {
									completeCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in complete cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in complete cb" );
								}
							} )
								.done( function( model, operation ) {
									doneCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in done cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in done cb" );
								} )
								.fail( function( model, operation ) {
									failCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in fail cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in fail cb" );
								} )
								.always( function( model, operation ) {
									alwaysCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in always cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in always cb" );
								} );
							
							// Make sure the appropriate callbacks executed
							Y.Assert.areSame( 1, successCallCount, "successCallCount" );
							Y.Assert.areSame( 0, errorCallCount, "errorCallCount" );
							Y.Assert.areSame( 1, completeCallCount, "completeCallCount" );
							Y.Assert.areSame( 1, doneCallCount, "doneCallCount" );
							Y.Assert.areSame( 0, failCallCount, "failCallCount" );
							Y.Assert.areSame( 1, alwaysCallCount, "alwaysCallCount" );
						},
						
						
						"save() should call its error/complete callbacks, and reject its deferred with the arguments (model, operation) if the proxy fails to 'create'" : function() {
							JsMockito.when( this.proxy ).create().then( function( operation ) {
								return new jQuery.Deferred().reject( operation ).promise();
							} );
							
							var MyModel = Model.extend( {
								attributes : [ 'id', 'name' ],
								proxy : this.proxy
							} );
							
							var successCallCount = 0,
							    errorCallCount = 0,
							    completeCallCount = 0,
							    doneCallCount = 0,
							    failCallCount = 0,
							    alwaysCallCount = 0;
							
							// Instantiate and run the save() method
							var modelInstance = new this.Model(); 
							var promise = modelInstance.save( {
								success : function( model, operation ) {
									successCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in success cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in success cb" );
								},
								error : function( model, operation ) {
									errorCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in error cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in error cb" );
								},
								complete : function( model, operation ) {
									completeCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in complete cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in complete cb" );
								}
							} )
								.done( function( model, operation ) {
									doneCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in done cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in done cb" );
								} )
								.fail( function( model, operation ) {
									failCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in fail cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in fail cb" );
								} )
								.always( function( model, operation ) {
									alwaysCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in always cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in always cb" );
								} );
							
							// Make sure the appropriate callbacks executed
							Y.Assert.areSame( 0, successCallCount, "successCallCount" );
							Y.Assert.areSame( 1, errorCallCount, "errorCallCount" );
							Y.Assert.areSame( 1, completeCallCount, "completeCallCount" );
							Y.Assert.areSame( 0, doneCallCount, "doneCallCount" );
							Y.Assert.areSame( 1, failCallCount, "failCallCount" );
							Y.Assert.areSame( 1, alwaysCallCount, "alwaysCallCount" );
						},
						
						
						"save() should call its success/complete callbacks, and reject its deferred with the arguments (model, operation) if the proxy successfully 'update's" : function() {
							JsMockito.when( this.proxy ).update().then( function( operation ) {
								return new jQuery.Deferred().resolve( operation ).promise();
							} );
							
							var successCallCount = 0,
							    errorCallCount = 0,
							    completeCallCount = 0,
							    doneCallCount = 0,
							    failCallCount = 0,
							    alwaysCallCount = 0;
							
							// Instantiate and run the save() method
							var modelInstance = new this.Model( { id: 1 } ); 
							var promise = modelInstance.save( {
								success : function( model, operation ) {
									successCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in success cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in success cb" );
								},
								error : function( model, operation ) {
									errorCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in error cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in error cb" );
								},
								complete : function( model, operation ) {
									completeCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in complete cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in complete cb" );
								}
							} )
								.done( function( model, operation ) {
									doneCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in done cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in done cb" );
								} )
								.fail( function( model, operation ) {
									failCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in fail cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in fail cb" );
								} )
								.always( function( model, operation ) {
									alwaysCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in always cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in always cb" );
								} );
							
							// Make sure the appropriate callbacks executed
							Y.Assert.areSame( 1, successCallCount, "successCallCount" );
							Y.Assert.areSame( 0, errorCallCount, "errorCallCount" );
							Y.Assert.areSame( 1, completeCallCount, "completeCallCount" );
							Y.Assert.areSame( 1, doneCallCount, "doneCallCount" );
							Y.Assert.areSame( 0, failCallCount, "failCallCount" );
							Y.Assert.areSame( 1, alwaysCallCount, "alwaysCallCount" );
						},
						
						
						"save() should call its error/complete callbacks, and reject its deferred with the arguments (model, operation) if the proxy fails to 'update'" : function() {
							JsMockito.when( this.proxy ).update().then( function( operation ) {
								return new jQuery.Deferred().reject( operation ).promise();
							} );
							
							var MyModel = Model.extend( {
								attributes : [ 'id', 'name' ],
								proxy : this.proxy
							} );
							
							var successCallCount = 0,
							    errorCallCount = 0,
							    completeCallCount = 0,
							    doneCallCount = 0,
							    failCallCount = 0,
							    alwaysCallCount = 0;
							
							// Instantiate and run the save() method
							var modelInstance = new this.Model( { id: 1 } ); 
							var promise = modelInstance.save( {
								success : function( model, operation ) {
									successCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in success cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in success cb" );
								},
								error : function( model, operation ) {
									errorCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in error cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in error cb" );
								},
								complete : function( model, operation ) {
									completeCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in complete cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in complete cb" );
								}
							} )
								.done( function( model, operation ) {
									doneCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in done cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in done cb" );
								} )
								.fail( function( model, operation ) {
									failCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in fail cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in fail cb" );
								} )
								.always( function( model, operation ) {
									alwaysCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in always cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in always cb" );
								} );
							
							// Make sure the appropriate callbacks executed
							Y.Assert.areSame( 0, successCallCount, "successCallCount" );
							Y.Assert.areSame( 1, errorCallCount, "errorCallCount" );
							Y.Assert.areSame( 1, completeCallCount, "completeCallCount" );
							Y.Assert.areSame( 0, doneCallCount, "doneCallCount" );
							Y.Assert.areSame( 1, failCallCount, "failCallCount" );
							Y.Assert.areSame( 1, alwaysCallCount, "alwaysCallCount" );
						}
						
					},
					
					
					{
						name : "Test basic persistence",
						
						setUp : function() {
							this.Model = Model.extend( {
								attributes : [ 'id', 'attribute1', 'attribute2' ]
							} );
						},
						
						// ---------------------------------
						
						
						"Model attributes that have been persisted should not be persisted again if they haven't changed since the last persist" : function() {
							var dataToPersist;
							var proxy = JsMockito.mock( Proxy.extend( {
								create  : Data.emptyFn,
								read    : Data.emptyFn,
								update  : Data.emptyFn,
								destroy : Data.emptyFn
							} ) );
							JsMockito.when( proxy ).update().then( function( operation ) {
								dataToPersist = operation.getModels()[ 0 ].getChanges();
								return new jQuery.Deferred().resolve( operation ).promise();
							} );
							
							var MyModel = this.Model.extend( {
								proxy : proxy
							} );
							var model = new MyModel( { id: 1 } );
							
							
							// Change attribute1 first (so that it has changes), then save
							model.set( 'attribute1', 'newattribute1value' );
							model.save();
							
							Y.Assert.areSame( 1, _.keys( dataToPersist ).length, "The dataToPersist should only have one key after attribute1 has been changed" );
							Y.ObjectAssert.ownsKeys( [ 'attribute1' ], dataToPersist, "The dataToPersist should have 'attribute1'" );
							
							
							// Now change attribute2. The dataToPersist should not include attribute1, since it has been persisted
							model.set( 'attribute2', 'newattribute2value' );
							model.save();
							
							Y.Assert.areSame( 1, _.keys( dataToPersist ).length, "The dataToPersist should only have one key after attribute2 has been changed" );
							Y.ObjectAssert.ownsKeys( [ 'attribute2' ], dataToPersist, "The dataToPersist should have 'attribute2'" );
						}
					},
					
					
						
					{
						name : "Test concurrent persistence and model updates",
						
						
						// Creates a test Model with a mock proxy, which fires its 'success' callback after the given timeout
						createModel : function( timeout ) {
							var proxy = JsMockito.mock( Proxy.extend( {
								create  : Data.emptyFn,
								read    : Data.emptyFn,
								update  : Data.emptyFn,
								destroy : Data.emptyFn
							} ) );
							JsMockito.when( proxy ).update().then( function( operation ) {
								// update method just resolves its Deferred after the timeout
								var deferred = new jQuery.Deferred();
								window.setTimeout( function() {
									deferred.resolve( operation );
								}, timeout );
								return deferred.promise();
							} );
							
							return Model.extend( {
								attributes : [ 'id', 'attribute1', 'attribute2' ],
								proxy : proxy
							} );
						},
						
						
						// ----------------------------
						
						// Test that model attributes that are updated during a persistence request do not get marked as committed
						
						"Model attributes that are updated (via set()) while a persistence request is in progress should not be marked as committed when the persistence request completes" : function() {
							var test = this;
							
							var MyModel = this.createModel( 50 ), // 50ms to resolved promise
							    model = new MyModel( { id: 1 } );
							
							// Initial set
							model.set( 'attribute1', "origValue1" );
							model.set( 'attribute2', "origValue2" );
							
							// Begin persistence operation, defining a callback for when it is complete
							model.save( {
								success : function() {
									test.resume( function() {
										Y.Assert.isTrue( model.isModified(), "The model should still be considered modified after the persistence operation. attribute1 was set after the persistence operation began." );
										
										Y.Assert.isTrue( model.isModified( 'attribute1' ), "attribute1 should be marked as modified. It was updated (set) after the persistence operation began." );
										Y.Assert.isFalse( model.isModified( 'attribute2' ), "attribute2 should not be marked as modified. It was not updated after the persistence operation began." );
										
										Y.Assert.areSame( "newValue1", model.get( 'attribute1' ), "a get() operation on attribute1 should return the new value." );
										Y.Assert.areSame( "origValue2", model.get( 'attribute2' ), "a get() operation on attribute2 should return the persisted value. It was not updated since the persistence operation began." );
									} );
								}
							} );
							
							
							// Now set the attribute while the async persistence operation is in progress. Test will resume when the timeout completes
							model.set( 'attribute1', "newValue1" );
							// note: not setting attribute2 here
							
							// Wait for the setTimeout in the MockProxy
							test.wait( 100 );
						},
						
						
						"Model attributes that are updated *more than once* (via set()) while a persistence request is in progress should not be marked as committed when the persistence request completes" : function() {
							var test = this;
							
							var MyModel = this.createModel( 50 ), // 50ms to resolved promise
							    model = new MyModel( { id: 1 } );
							
							// Initial set
							model.set( 'attribute1', "origValue1" );
							model.set( 'attribute2', "origValue2" );
							
							// Begin persistence operation, defining a callback for when it is complete
							model.save( {
								success : function() {
									test.resume( function() {
										Y.Assert.isTrue( model.isModified(), "The model should still be considered modified after the persistence operation. attribute1 was set after the persistence operation began." );
										
										Y.Assert.isTrue( model.isModified( 'attribute1' ), "attribute1 should be marked as modified. It was updated (set) after the persistence operation began." );
										Y.Assert.isFalse( model.isModified( 'attribute2' ), "attribute2 should not be marked as modified. It was not updated after the persistence operation began." );
										
										Y.Assert.areSame( "newValue11", model.get( 'attribute1' ), "a get() operation on attribute1 should return the new value." );
										Y.Assert.areSame( "origValue2", model.get( 'attribute2' ), "a get() operation on attribute2 should return the persisted value. It was not updated since the persistence operation began." );
										
										// Now rollback the model, and see if the original value of attribute1 is still there
										model.rollback();
										Y.Assert.areSame( "origValue1", model.get( 'attribute1' ), "The value for attribute1 should have been rolled back to its original value" ); 
									} );
								}
							} );
							
							
							// Now set the attribute twice while the async persistence operation is in progress. Test will resume when the timeout completes
							model.set( 'attribute1', "newValue1" );
							model.set( 'attribute1', "newValue11" );  // set it again
							// note: not setting attribute2 here
							
							// Wait for the setTimeout in the MockProxy
							test.wait( 100 );
						}
						
					},
					
					
					
					{
						name : "Test save() with related Collections that need to be sync'd first",
						
						setUp : function() {
							this.proxy = JsMockito.mock( Proxy.extend( {
								create  : Data.emptyFn,
								read    : Data.emptyFn,
								update  : Data.emptyFn,
								destroy : Data.emptyFn
							} ) );
							
							this.Model = Model.extend( {
								attributes : [
									{ name: 'id', type: 'int' },
									{ name: 'attr', type: 'string' },
									{ name: 'c1', type: 'collection' },
									{ name: 'c2', type: 'collection' }
								],
								
								proxy : this.proxy
							} );
							
							this.collection1 = JsMockito.mock( Collection );
							JsMockito.when( this.collection1 ).getModels().thenReturn( [] );
							
							this.collection2 = JsMockito.mock( Collection );
							JsMockito.when( this.collection2 ).getModels().thenReturn( [] );
						},
						
						
						"save() should synchronize any nested 'related' (as opposed to 'embedded') collections before synchronizing itself" : function() {
							var collection1SyncCallCount = 0,
							    collection2SyncCallCount = 0,
							    collection1SyncDoneCount = 0,
							    collection2SyncDoneCount = 0;
							
							JsMockito.when( this.collection1 ).sync().then( function() {
								collection1SyncCallCount++;
								
								var deferred = new jQuery.Deferred();
								deferred.done( function() { collection1SyncDoneCount++; } );
								setTimeout( function() { deferred.resolve(); }, 50 );
								
								return deferred.promise();
							} );
							JsMockito.when( this.collection2 ).sync().then( function() {
								collection2SyncCallCount++;
								
								var deferred = new jQuery.Deferred();
								deferred.done( function() { collection2SyncDoneCount++; } );
								setTimeout( function() { deferred.resolve(); }, 50 );
								
								return deferred.promise();
							} );
							
							JsMockito.when( this.proxy ).create().then( function( operation ) {
								var deferred = new jQuery.Deferred();
								setTimeout( function() { deferred.resolve( operation ); }, 25 );
								return deferred.promise();
							} );
							
							
							var model = new this.Model( {
								attr : "attrValue",
								c1   : this.collection1,
								c2   : this.collection2
							} );
							
							var successCount = 0,   // 3 vars for callbacks
							    errorCount = 0,
							    completeCount = 0,
							    doneCount = 0,      // 3 vars for returned Promise object
							    failCount = 0,
							    alwaysCount = 0;
							    
							var savePromise = model.save( {
								success : function() { successCount++; },
								error : function() { errorCount++; },
								complete : function() { completeCount++; }
							} );
							savePromise
								.done( function() { doneCount++; } )
								.fail( function() { failCount++; } )
								.always( function() { alwaysCount++; } );
							
							Y.Assert.areSame( 1, collection1SyncCallCount, "sync() should have been called on collection1" );
							Y.Assert.areSame( 1, collection2SyncCallCount, "sync() should have been called on collection2" );
							Y.Assert.areSame( 0, collection1SyncDoneCount, "collection1's sync should not yet be done" );
							Y.Assert.areSame( 0, collection2SyncDoneCount, "collection2's sync should not yet be done" );
							Y.Assert.areSame( 0, successCount, "Shouldn't have any success calls yet" );
							Y.Assert.areSame( 0, errorCount, "Shouldn't have any error calls yet" );
							Y.Assert.areSame( 0, completeCount, "Shouldn't have any complete calls yet" );
							Y.Assert.areSame( 0, doneCount, "Shouldn't have any done calls yet" );
							Y.Assert.areSame( 0, failCount, "Shouldn't have any fail calls yet" );
							Y.Assert.areSame( 0, alwaysCount, "Shouldn't have any always calls yet" );
							
							this.wait( function() {
								Y.Assert.areSame( 1, collection1SyncDoneCount, "collection1's sync should now be done" );
								Y.Assert.areSame( 1, collection2SyncDoneCount, "collection2's sync should now be done" );
								Y.Assert.areSame( 0, successCount, "Shouldn't have any success calls yet (2)" );
								Y.Assert.areSame( 0, errorCount, "Shouldn't have any error calls yet (2)" );
								Y.Assert.areSame( 0, completeCount, "Shouldn't have any complete calls yet (2)" );
								Y.Assert.areSame( 0, doneCount, "Shouldn't have any done calls yet (2)" );
								Y.Assert.areSame( 0, failCount, "Shouldn't have any fail calls yet (2)" );
								Y.Assert.areSame( 0, alwaysCount, "Shouldn't have any always calls yet (2)" );
								
								this.wait( function() {
									//Y.Assert.areSame( 1, successCount, "`complete` callback should have been called" );
									//Y.Assert.areSame( 0, errorCount, "`error` callback should NOT have been called" );
									//Y.Assert.areSame( 1, completeCount, "`complete` callback should have been called" );
									Y.Assert.areSame( 1, doneCount, "`done` callback should have been called" );
									Y.Assert.areSame( 0, failCount, "`fail` callback should NOT have been called" );
									Y.Assert.areSame( 1, alwaysCount, "`always` callback should have been called" );
								}, 50 );  // wait for the model's save() to complete
								
							}, 75 );  // wait for collection sync()'s to complete
						},
						
						
						"save() should call the 'error' and 'fail' callbacks if a collection fails to synchronize" : function() {
							var collection1SyncCallCount = 0,
							    collection2SyncCallCount = 0,
							    collection1SyncDoneCount = 0,
							    collection2SyncFailCount = 0;
							
							JsMockito.when( this.collection1 ).sync().then( function() {
								collection1SyncCallCount++;
								
								var deferred = new jQuery.Deferred();
								deferred.done( function() { collection1SyncDoneCount++; } );
								setTimeout( function() { deferred.resolve(); }, 50 );
								
								return deferred.promise();
							} );
							JsMockito.when( this.collection2 ).sync().then( function() {
								collection2SyncCallCount++;
								
								var deferred = new jQuery.Deferred();
								deferred.fail( function() { collection2SyncFailCount++; } );
								setTimeout( function() { deferred.reject(); }, 50 );
								
								return deferred.promise();
							} );
							
							JsMockito.when( this.proxy ).create().then( function( operation ) {
								var deferred = new jQuery.Deferred();
								setTimeout( function() { deferred.resolve( operation ); }, 25 );
								return deferred.promise();
							} );
							
							
							var model = new this.Model( {
								attr : "attrValue",
								c1   : this.collection1,
								c2   : this.collection2
							} );
							
							var successCount = 0,   // 3 vars for callbacks
							    errorCount = 0,
							    completeCount = 0,
							    doneCount = 0,      // 3 vars for returned Promise object
							    failCount = 0,
							    alwaysCount = 0;
							    
							var savePromise = model.save( {
								success : function() { successCount++; },
								error : function() { errorCount++; },
								complete : function() { completeCount++; }
							} );
							savePromise
								.done( function() { doneCount++; } )
								.fail( function() { failCount++; } )
								.always( function() { alwaysCount++; } );
							
							Y.Assert.areSame( 1, collection1SyncCallCount, "sync() should have been called on collection1" );
							Y.Assert.areSame( 1, collection2SyncCallCount, "sync() should have been called on collection2" );
							Y.Assert.areSame( 0, collection1SyncDoneCount, "collection1's sync should not yet be done" );
							Y.Assert.areSame( 0, collection2SyncFailCount, "collection2's sync should not yet be failed" );
							Y.Assert.areSame( 0, successCount, "Shouldn't have any success calls yet" );
							Y.Assert.areSame( 0, errorCount, "Shouldn't have any error calls yet" );
							Y.Assert.areSame( 0, completeCount, "Shouldn't have any complete calls yet" );
							Y.Assert.areSame( 0, doneCount, "Shouldn't have any done calls yet" );
							Y.Assert.areSame( 0, failCount, "Shouldn't have any fail calls yet" );
							Y.Assert.areSame( 0, alwaysCount, "Shouldn't have any always calls yet" );
							
							this.wait( function() {
								Y.Assert.areSame( 1, collection1SyncDoneCount, "collection1's sync should now be done" );
								Y.Assert.areSame( 1, collection2SyncFailCount, "collection2's sync should now be failed" );
								
								Y.Assert.areSame( 0, successCount, "`complete` callback NOT should have been called" );
								Y.Assert.areSame( 1, errorCount, "`error` callback should have been called" );
								Y.Assert.areSame( 1, completeCount, "`complete` callback should have been called" );
								Y.Assert.areSame( 0, doneCount, "`done` callback should NOT have been called" );
								Y.Assert.areSame( 1, failCount, "`fail` callback should have been called" );
								Y.Assert.areSame( 1, alwaysCount, "`always` callback should have been called" );
							}, 75 );  // wait for collection sync()'s to complete
						},
						
						
						"save() should call the 'error' and 'fail' callbacks if collections synchronize, but the model itself fails to save" : function() {
							var collection1SyncCallCount = 0,
							    collection2SyncCallCount = 0,
							    collection1SyncDoneCount = 0,
							    collection2SyncDoneCount = 0;
							
							JsMockito.when( this.collection1 ).sync().then( function() {
								collection1SyncCallCount++;
								
								var deferred = new jQuery.Deferred();
								deferred.done( function() { collection1SyncDoneCount++; } );
								setTimeout( function() { deferred.resolve(); }, 50 );
								
								return deferred.promise();
							} );
							JsMockito.when( this.collection2 ).sync().then( function() {
								collection2SyncCallCount++;
								
								var deferred = new jQuery.Deferred();
								deferred.done( function() { collection2SyncDoneCount++; } );
								setTimeout( function() { deferred.resolve(); }, 50 );
								
								return deferred.promise();
							} );
							
							JsMockito.when( this.proxy ).create().then( function( model, options ) {
								var deferred = new jQuery.Deferred();
								setTimeout( function() { deferred.reject(); }, 25 );
								return deferred.promise();
							} );
							
							
							var model = new this.Model( {
								attr : "attrValue",
								c1   : this.collection1,
								c2   : this.collection2
							} );
							
							var successCount = 0,   // 3 vars for callbacks
							    errorCount = 0,
							    completeCount = 0,
							    doneCount = 0,      // 3 vars for returned Promise object
							    failCount = 0,
							    alwaysCount = 0;
							
							var savePromise = model.save( {
								success : function() { successCount++; },
								error : function() { errorCount++; },
								complete : function() { completeCount++; }
							} );
							savePromise
								.done( function() { doneCount++; } )
								.fail( function() { failCount++; } )
								.always( function() { alwaysCount++; } );
							
							Y.Assert.areSame( 1, collection1SyncCallCount, "sync() should have been called on collection1" );
							Y.Assert.areSame( 1, collection2SyncCallCount, "sync() should have been called on collection2" );
							Y.Assert.areSame( 0, collection1SyncDoneCount, "collection1's sync should not yet be done" );
							Y.Assert.areSame( 0, collection2SyncDoneCount, "collection2's sync should not yet be done" );
							Y.Assert.areSame( 0, successCount, "Shouldn't have any success calls yet" );
							Y.Assert.areSame( 0, errorCount, "Shouldn't have any error calls yet" );
							Y.Assert.areSame( 0, completeCount, "Shouldn't have any complete calls yet" );
							Y.Assert.areSame( 0, doneCount, "Shouldn't have any done calls yet" );
							Y.Assert.areSame( 0, failCount, "Shouldn't have any fail calls yet" );
							Y.Assert.areSame( 0, alwaysCount, "Shouldn't have any always calls yet" );
							
							this.wait( function() {
								Y.Assert.areSame( 1, collection1SyncDoneCount, "collection1's sync should now be done" );
								Y.Assert.areSame( 1, collection2SyncDoneCount, "collection2's sync should now be done" );
								Y.Assert.areSame( 0, successCount, "Shouldn't have any success calls yet (2)" );
								Y.Assert.areSame( 0, errorCount, "Shouldn't have any error calls yet (2)" );
								Y.Assert.areSame( 0, completeCount, "Shouldn't have any complete calls yet (2)" );
								Y.Assert.areSame( 0, doneCount, "Shouldn't have any done calls yet (2)" );
								Y.Assert.areSame( 0, failCount, "Shouldn't have any fail calls yet (2)" );
								Y.Assert.areSame( 0, alwaysCount, "Shouldn't have any always calls yet (2)" );
								
								this.wait( function() {
									Y.Assert.areSame( 0, successCount, "`complete` callback NOT should have been called" );
									Y.Assert.areSame( 1, errorCount, "`error` callback should have been called" );
									Y.Assert.areSame( 1, completeCount, "`complete` callback should have been called" );
									Y.Assert.areSame( 0, doneCount, "`done` callback should NOT have been called" );
									Y.Assert.areSame( 1, failCount, "`fail` callback should have been called" );
									Y.Assert.areSame( 1, alwaysCount, "`always` callback should have been called" );								
								}, 50 );  // wait for the model's save() to complete
								
							}, 75 );  // wait for collection sync()'s to complete
						}
					}
				]
			},
			
			
			{
				/*
				 * Test destroy()
				 */
				name: 'Test destroy()',
				ttype : 'testsuite',
				
				items : [
					{
						name : "General destroy() tests",
						
						// Special instructions
						_should : {
							error : {
								"destroy() should throw an error if there is no configured proxy when it tries to destroy a model that has been persisted (i.e. has an id)" : 
									"Data.Model::destroy() error: Cannot destroy model on server. No proxy."
							}
						},
						
						
						"destroy() should throw an error if there is no configured proxy when it tries to destroy a model that has been persisted (i.e. has an id)" : function() {
							var MyModel = Model.extend( {
								attributes : [ 'id', 'attribute1', 'attribute2' ]
								// note: no proxy
							} );
							
							var model = new MyModel( { id: 1 } );  // the model needs an id to be considered as persisted on the server
							model.destroy();
							Y.Assert.fail( "destroy() should have thrown an error with no configured proxy" );
						},
						
						
						"destroy() should delegate to its proxy's destroy() method to persist the destruction of the model" : function() {
							var proxy = JsMockito.mock( Proxy.extend( {
								create  : Data.emptyFn,
								read    : Data.emptyFn,
								update  : Data.emptyFn,
								destroy : Data.emptyFn
							} ) );
							JsMockito.when( proxy ).destroy().thenReturn( new jQuery.Deferred().promise() );
							
							var MyModel = Model.extend( {
								attributes : [ 'id' ],
								proxy : proxy
							} );
							
							var model = new MyModel( { id: 1 } );  // the model needs an id to be considered as persisted on the server
							
							// Run the destroy() method to delegate 
							model.destroy();
							
							try {
								JsMockito.verify( proxy ).destroy();
							} catch( e ) {
								Y.Assert.fail( "The model should have delegated to the destroy method exactly once." );
							}
						},
						
						
						"upon successful destruction of the Model, the Model should fire its 'destroy' event" : function() {
							var proxy = JsMockito.mock( Proxy.extend( {
								create  : Data.emptyFn,
								read    : Data.emptyFn,
								update  : Data.emptyFn,
								destroy : Data.emptyFn
							} ) );
							JsMockito.when( proxy ).destroy().thenReturn( new jQuery.Deferred().resolve().promise() );
							
							var MyModel = Model.extend( {
								attributes : [ 'id' ],
								proxy : proxy
							} );
							
							var model = new MyModel( { id: 1 } );  // the model needs an id to be considered as persisted on the server
							
							var destroyEventFired = false;
							model.addListener( 'destroy', function() {
								destroyEventFired = true;
							} );
							
							// Run the destroy() method to delegate 
							model.destroy();
							Y.Assert.isTrue( destroyEventFired, "Should have fired its destroy event" );
						}
					},
				
				
					{
						name : "destroy() callbacks and returned promise tests",
						
						setUp : function() {
							this.proxy = JsMockito.mock( Proxy.extend( {
								// Implementation of abstract interface
								create: Data.emptyFn,
								read: Data.emptyFn,
								update: Data.emptyFn,
								destroy: Data.emptyFn
							} ) );
							
							this.Model = Model.extend( {
								attributes : [ 'id', 'name' ],
								proxy : this.proxy
							} );
						},
						
						
						// Callbacks tests
						
						"destroy() should call its success/complete callbacks, and reject its deferred with the arguments (model, operation) when successful" : function() {
							JsMockito.when( this.proxy ).destroy().then( function( operation ) {
								return new jQuery.Deferred().resolve( operation ).promise();
							} );
							
							var successCallCount = 0,
							    errorCallCount = 0,
							    completeCallCount = 0,
							    doneCallCount = 0,
							    failCallCount = 0,
							    alwaysCallCount = 0;
							
							// Instantiate and run the destroy() method
							var modelInstance = new this.Model( { id: 1 } ); 
							var promise = modelInstance.destroy( {
								success : function( model, operation ) {
									successCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in success cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in success cb" );
								},
								error : function( model, operation ) {
									errorCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in error cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in error cb" );
								},
								complete : function( model, operation ) {
									completeCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in complete cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in complete cb" );
								}
							} )
								.done( function( model, operation ) {
									doneCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in done cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in done cb" );
								} )
								.fail( function( model, operation ) {
									failCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in fail cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in fail cb" );
								} )
								.always( function( model, operation ) {
									alwaysCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in always cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in always cb" );
								} );
							
							// Make sure the appropriate callbacks executed
							Y.Assert.areSame( 1, successCallCount, "successCallCount" );
							Y.Assert.areSame( 0, errorCallCount, "errorCallCount" );
							Y.Assert.areSame( 1, completeCallCount, "completeCallCount" );
							Y.Assert.areSame( 1, doneCallCount, "doneCallCount" );
							Y.Assert.areSame( 0, failCallCount, "failCallCount" );
							Y.Assert.areSame( 1, alwaysCallCount, "alwaysCallCount" );
						},
						
						
						"destroy() should call its error/complete callbacks, and reject its deferred with the arguments (model, operation) if an error occurs" : function() {
							JsMockito.when( this.proxy ).destroy().then( function( operation ) {
								return new jQuery.Deferred().reject( operation ).promise();
							} );
							
							var MyModel = Model.extend( {
								attributes : [ 'id', 'name' ],
								proxy : this.proxy
							} );
							
							var successCallCount = 0,
							    errorCallCount = 0,
							    completeCallCount = 0,
							    doneCallCount = 0,
							    failCallCount = 0,
							    alwaysCallCount = 0;
							
							// Instantiate and run the destroy() method
							var modelInstance = new this.Model( { id: 1 } ); 
							var promise = modelInstance.destroy( {
								success : function( model, operation ) {
									successCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in success cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in success cb" );
								},
								error : function( model, operation ) {
									errorCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in error cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in error cb" );
								},
								complete : function( model, operation ) {
									completeCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in complete cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in complete cb" );
								}
							} )
								.done( function( model, operation ) {
									doneCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in done cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in done cb" );
								} )
								.fail( function( model, operation ) {
									failCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in fail cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in fail cb" );
								} )
								.always( function( model, operation ) {
									alwaysCallCount++;
									Y.Assert.areSame( modelInstance, model, "the model should have been arg 1 in always cb" );
									Y.Assert.isInstanceOf( WriteOperation, operation, "WriteOperation should have been arg 2 in always cb" );
								} );
							
							// Make sure the appropriate callbacks executed
							Y.Assert.areSame( 0, successCallCount, "successCallCount" );
							Y.Assert.areSame( 1, errorCallCount, "errorCallCount" );
							Y.Assert.areSame( 1, completeCallCount, "completeCallCount" );
							Y.Assert.areSame( 0, doneCallCount, "doneCallCount" );
							Y.Assert.areSame( 1, failCallCount, "failCallCount" );
							Y.Assert.areSame( 1, alwaysCallCount, "alwaysCallCount" );
						},
						
						
						
						
						"destroy() should call its 'success' and 'complete' callbacks if the proxy is successful" : function() {
							var successCallCount = 0,
							    completeCallCount = 0;
							
							JsMockito.when( this.proxy ).destroy().thenReturn( new jQuery.Deferred().resolve().promise() );
							
							var MyModel = Model.extend( {
								attributes : [ 'id' ],
								proxy  : this.proxy
							} );
							var model = new MyModel( { id: 1 } );  // the model needs an id to be considered as persisted on the server
							
							model.destroy( {
								success  : function() { successCallCount++; },
								complete : function() { completeCallCount++; },
								scope    : this
							} );
							
							Y.Assert.areSame( 1, successCallCount, "The 'success' function should have been called exactly once" );
							Y.Assert.areSame( 1, completeCallCount, "The 'complete' function should have been called exactly once" );
						},
						
						
						"destroy() should call its 'error' and 'complete' callbacks if the proxy encounters an error" : function() {
							var errorCallCount = 0,
							    completeCallCount = 0;
							
							JsMockito.when( this.proxy ).destroy().thenReturn( new jQuery.Deferred().reject().promise() );
							
							var MyModel = Model.extend( {
								attributes : [ 'id' ],
								proxy  : this.proxy
							} );
							var model = new MyModel( { id: 1 } );  // the model needs an id to be considered as persisted on the server
							
							model.destroy( {
								error    : function() { errorCallCount++; },
								complete : function() { completeCallCount++; },
								scope    : this
							} );
							
							Y.Assert.areSame( 1, errorCallCount, "The 'error' function should have been called exactly once" );
							Y.Assert.areSame( 1, completeCallCount, "The 'complete' function should have been called exactly once" );
						},
						
						
						// -------------------------------------
						
						// Returned Promise object tests
						
						"destroy() should return a jQuery.Promise object, which has its `done` and `always` callbacks executed upon successful completion" : function() {
							var doneCallCount = 0,
							    failCallCount = 0,
							    alwaysCallCount = 0;
							
							JsMockito.when( this.proxy ).destroy().thenReturn( new jQuery.Deferred().resolve().promise() );
							
							var MyModel = Model.extend( {
								attributes : [ 'id' ],
								proxy  : this.proxy
							} );
							var model = new MyModel( { id: 1 } );  // the model needs an id to be considered as persisted on the server
							
							var promise = model.destroy()
								.done( function()   { doneCallCount++; } )
								.fail( function()   { failCallCount++; } )
								.always( function() { alwaysCallCount++; } );
							
							Y.Assert.areSame( 1, doneCallCount, "The 'done' function should have been called exactly once" );
							Y.Assert.areSame( 0, failCallCount, "The 'fail' function should have not been called" );
							Y.Assert.areSame( 1, alwaysCallCount, "The 'always' function should have been called exactly once" );
						},
						
						
						"destroy() should return a jQuery.Promise object, which has its `fail` and `always` callbacks executed upon an error while persisting" : function() {
							var doneCallCount = 0,
							    failCallCount = 0,
							    alwaysCallCount = 0;
							
							JsMockito.when( this.proxy ).destroy().thenReturn( new jQuery.Deferred().reject().promise() );
							
							var MyModel = Model.extend( {
								attributes : [ 'id' ],
								proxy  : this.proxy
							} );
							var model = new MyModel( { id: 1 } );  // the model needs an id to be considered as persisted on the server
							
							var promise = model.destroy()
								.done( function()   { doneCallCount++; } )
								.fail( function()   { failCallCount++; } )
								.always( function() { alwaysCallCount++; } );
							
							Y.Assert.areSame( 0, doneCallCount, "The 'done' function should not have been called" );
							Y.Assert.areSame( 1, failCallCount, "The 'fail' function should have been called exactly once" );
							Y.Assert.areSame( 1, alwaysCallCount, "The 'always' function should have been called exactly once" );
						}
					}
				]
			}
		]
		
	} ) );
} );