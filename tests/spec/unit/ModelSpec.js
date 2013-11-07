/*global define, window, _, jasmine, describe, beforeEach, afterEach, it, xit, expect, spyOn, JsMockito */
/*jshint browser:true, sub:true */
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
	'data/persistence/proxy/Proxy',
	'data/persistence/proxy/Rest',
	'data/persistence/proxy/Memory',
	'data/persistence/operation/Load',
	'data/persistence/operation/Save',
	'data/persistence/operation/Destroy',
	'data/persistence/request/Write',
	'data/persistence/request/Create',
	'data/persistence/request/Read',
	'data/persistence/request/Update',
	'data/persistence/request/Destroy',
	
	'spec/lib/ManualResolveProxy',
	'spec/lib/ModelPersistenceVerifier'
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
	MemoryProxy,
	LoadOperation,
	SaveOperation,
	DestroyOperation,
	WriteRequest,
	CreateRequest,
	ReadRequest,
	UpdateRequest,
	DestroyRequest,
	
	ManualResolveProxy,
	ModelPersistenceVerifier
) {

	describe( 'data.Model', function() {
		
		// A concrete Proxy class for tests to use.
		var ConcreteProxy = Proxy.extend( {
			// Implementation of abstract interface
			create: Data.emptyFn,
			read: Data.emptyFn,
			update: Data.emptyFn,
			destroy: Data.emptyFn
		} );
		
		// A concrete DataComponent for tests to use
		var ConcreteDataComponent = DataComponent.extend( { 
			// Implementation of abstract interface
			getData : Data.emptyFn,
			isModified : Data.emptyFn,
			commit : Data.emptyFn,
			rollback : Data.emptyFn
		} );
		
		// A concrete DataComponentAttribute for Models to be configured with
		var ConcreteDataComponentAttribute = DataComponentAttribute.extend( {} );
		
		
		describe( "Test the onClassExtended static method", function() {
			
			it( "After extending model, the subclass should have a unique __Data_modelTypeId property", function() {
				var MyModel = Model.extend( {} );
				
				expect( _.isString( MyModel.__Data_modelTypeId ) ).toBe( true );  // orig YUI Test err msg: "The Model should now have a static __Data_modelTypeId property that is a string"
			} );
			
			
			it( "Attributes should inherit from a Model subclass's superclass when the subclass defines no attributes of its own", function() {
				var MyModel = Model.extend( {
					attributes : [ 'field1' ]
				} );
				var SubClassModel = MyModel.extend( {} );
				
				var attributes = (new SubClassModel()).attributes;
				expect( _.keys( attributes ).length ).toBe( 1 );  // orig YUI Test err msg: "There should be exactly 1 attribute"
				expect( attributes.hasOwnProperty( 'field1' ) ).toBe( true );  // orig YUI Test err msg: "field1 should exist as the attribute"
			} );
			
			
			it( "Attributes should inherit from a Model subclass's superclass when the subclass does define attributes of its own", function() {
				// Reference the base class, and create a subclass
				var MyModel = Model.extend( {} );
				var SubClassModel = MyModel.extend( {
					attributes : [ 'a', 'b' ]
				} );
				
				var attributes = (new SubClassModel()).attributes;
				expect( _.keys( attributes ).length ).toBe( 2 );  // orig YUI Test err msg: "There should be exactly 2 attributes"
				expect( attributes.hasOwnProperty( 'a' ) ).toBe( true );  // orig YUI Test err msg: "SubClassModel should have the 'a' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'b' ) ).toBe( true );  // orig YUI Test err msg: "SubClassModel should have the 'b' attribute defined in its final 'attributes' hash."
			} );
			
			
			it( "Attributes should inherit from a Model subclass's superclass, and its superclass as well (i.e. more than one level up)", function() {
				// Reference the base class, and create two subclasses
				var MyModel = Model.extend( {} );
				var SubClassModel = Class.extend( MyModel, {
					attributes : [ 'a', 'b' ]
				} );
				var SubSubClassModel = Class.extend( SubClassModel, {
					attributes : [ 'c', 'd', 'e' ]
				} );
				
				var attributes = (new SubSubClassModel()).attributes;
				expect( _.keys( attributes ).length ).toBe( 5 );  // orig YUI Test err msg: "There should be exactly 5 attributes"
				expect( attributes.hasOwnProperty( 'a' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'b' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'c' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'c' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'd' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'd' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'e' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'e' attribute defined in its final 'attributes' hash."
			} );
			
			
			it( "Attributes should inherit from a Model subclass's superclass, and all of its superclasses (i.e. more than two levels up)", function() {
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
				expect( _.keys( attributes ).length ).toBe( 6 );  // orig YUI Test err msg: "There should be exactly 6 attributes"
				expect( attributes.hasOwnProperty( 'a' ) ).toBe( true );  // orig YUI Test err msg: "SubSubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'b' ) ).toBe( true );  // orig YUI Test err msg: "SubSubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'c' ) ).toBe( true );  // orig YUI Test err msg: "SubSubSubClassModel should have the 'c' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'd' ) ).toBe( true );  // orig YUI Test err msg: "SubSubSubClassModel should have the 'd' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'e' ) ).toBe( true );  // orig YUI Test err msg: "SubSubSubClassModel should have the 'e' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'f' ) ).toBe( true );  // orig YUI Test err msg: "SubSubSubClassModel should have the 'f' attribute defined in its final 'attributes' hash."
			} );
			
			
			it( "Attribute definitions defined in a subclass should take precedence over attribute definitions in a superclass", function() {
				var MyModel = Model.extend( {} );
				var SubClassModel = Class.extend( MyModel, {
					attributes : [ { name : 'a', defaultValue: 1 } ]
				} );
				var SubSubClassModel = Class.extend( SubClassModel, {
					attributes : [ { name : 'a', defaultValue: 2 }, 'b' ]
				} );
				
				var attributes = (new SubSubClassModel()).attributes;
				expect( _.keys( attributes ).length ).toBe( 2 );  // orig YUI Test err msg: "There should be exactly 2 attributes"
				expect( attributes.hasOwnProperty( 'a' ) ).toBe( true );  // orig YUI Test err msg: "SubSubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'b' ) ).toBe( true );  // orig YUI Test err msg: "SubSubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash."
				
				// Check that the default value of the Attribute 'a' is 2, not 1 (as the Attribute in the subclass should have overridden its superclass Attribute)
				expect( attributes.a.defaultValue ).toBe( 2 );  // orig YUI Test err msg: "The attribute in the subclass should have overridden its superclass"
			} );
			
			
			it( "A subclass that doesn't define any attributes should inherit all of them from its superclass(es)", function() {
				// Reference the base class, and create two subclasses
				var MyModel = Model.extend( {} );
				var SubClassModel = Class.extend( MyModel, {
					attributes : [ 'a', 'b' ]
				} );
				var SubSubClassModel = Class.extend( SubClassModel, {} );
				
				var attributes = (new SubSubClassModel()).attributes;
				expect( _.keys( attributes ).length ).toBe( 2 );  // orig YUI Test err msg: "There should be exactly 2 attributes"
				expect( attributes.hasOwnProperty( 'a' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'b' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash."
			} );
			
			
			it( "A superclass that doesn't define any attributes should be skipped for attributes, but the subclass should still inherit from superclasses above it", function() {
				// Reference the base class, and create two subclasses
				var MyModel = Model.extend( {} );
				var SubClassModel = Class.extend( MyModel, {} );  // one that doesn't define any attributes
				var SubSubClassModel = Class.extend( SubClassModel, {
					attributes : [ 'a', 'b' ]
				} );
				
				var attributes = (new SubSubClassModel()).attributes;
				expect( _.keys( attributes ).length ).toBe( 2 );  // orig YUI Test err msg: "There should be exactly 2 attributes"
				expect( attributes.hasOwnProperty( 'a' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'b' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash."
			} );
			
			
			it( "Yet another test for attributes inheritance...", function() {
				var MyModel = Model.extend( {
					attributes : [ 'a', 'b' ]
				} );
				var SubModel = MyModel.extend( {
					attributes : [ 'c' ]
				} );
				
				var attributes = (new SubModel()).attributes;
				expect( _.keys( attributes ).length ).toBe( 3 );  // orig YUI Test err msg: "There should be exactly 3 attributes"
				expect( attributes.hasOwnProperty( 'a' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'a' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'b' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'b' attribute defined in its final 'attributes' hash."
				expect( attributes.hasOwnProperty( 'c' ) ).toBe( true );  // orig YUI Test err msg: "SubSubClassModel should have the 'c' attribute defined in its final 'attributes' hash."
			} );
			
		} );
		
		
		describe( 'getAttributes() static method', function() {
			
			it( "should retrieve an Object (map) of the attributes for the model", function() {
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
				expect( superclassModelAttrKeys.length ).toBe( 2 );  // orig YUI Test err msg: "There should have been 2 keys in the array for the superclassModelAttrKeys"
				expect( _.contains( superclassModelAttrKeys, 'id' ) ).toBe( true );  // orig YUI Test err msg: "The key 'id' should exist"
				expect( _.contains( superclassModelAttrKeys, 'superclassAttr' ) ).toBe( true );  // orig YUI Test err msg: "The key 'superclassAttr' should exist"
				expect( superclassModelAttrs.id instanceof NumberAttribute ).toBe( true );  // orig YUI Test err msg: "The `id` Attribute should have been an instance of Number"
				expect( superclassModelAttrs.superclassAttr instanceof StringAttribute ).toBe( true );  // orig YUI Test err msg: "The `superclassAttr` Attribute should have been an instance of String"
				
				var subclassModelAttrs = SubclassModel.getAttributes();    // call the static method on the subclass (which should be statically inherited by the subclass)
				var subclassModelAttrKeys = _.keys( subclassModelAttrs );
				expect( subclassModelAttrKeys.length ).toBe( 3 );  // orig YUI Test err msg: "There should have been 3 keys in the array for the subclassModelAttrKeys"
				expect( _.contains( subclassModelAttrKeys, 'id' ) ).toBe( true );  // orig YUI Test err msg: "The key 'id' should exist"
				expect( _.contains( subclassModelAttrKeys, 'superclassAttr' ) ).toBe( true );  // orig YUI Test err msg: "The key 'superclassAttr' should exist"
				expect( _.contains( subclassModelAttrKeys, 'subclassAttr' ) ).toBe( true );  // orig YUI Test err msg: "The key 'subclassAttr' should exist"
				expect( subclassModelAttrs.id instanceof NumberAttribute ).toBe( true );  // orig YUI Test err msg: "The `id` Attribute should have been an instance of Number"
				expect( subclassModelAttrs.superclassAttr instanceof StringAttribute ).toBe( true );  // orig YUI Test err msg: "The `superclassAttr` Attribute should have been an instance of String"
				expect( subclassModelAttrs.subclassAttr instanceof BooleanAttribute ).toBe( true );  // orig YUI Test err msg: "The `subclassAttr` Attribute should have been an instance of Boolean"
			} );
			
		} );
		
		
		describe( "constructor", function() {
			
			describe( "Test lazy instantiating a proxy", function() {
				
				it( "Attempting to instantiate a proxy with no 'type' attribute should throw an error", function() {
					expect( function() {
						var TestModel = Class.extend( Model, {
							attributes: [ 'attribute1' ],
							proxy : {}
						} );
						
						var model = new TestModel();
					} ).toThrow( "data.persistence.proxy.Proxy.create(): No `type` property provided on proxy config object" );
				} );
				
				
				it( "Attempting to instantiate a proxy with an invalid 'type' attribute should throw an error", function() {
					expect( function() {
						var TestModel = Class.extend( Model, {
							attributes: [ 'attribute1' ],
							proxy : { 
								type : 'nonExistentProxy'
							}
						} );
						
						var model = new TestModel();
					} ).toThrow( "data.persistence.proxy.Proxy.create(): Unknown Proxy type: 'nonexistentproxy'" );
				} );
				
				
				it( "Providing a valid config object should instantiate the Proxy *on class's the prototype*", function() {
					var TestModel = Class.extend( Model, {
						attributes: [ 'attribute1' ],
						proxy : { 
							type : 'rest'  // a valid proxy type
						}
					} );
					
					var model = new TestModel();
					expect( TestModel.prototype.proxy instanceof RestProxy ).toBe( true );
				} );
				
				
				it( "Providing a valid config object should instantiate the Proxy *on the correct subclass's prototype*, shadowing superclasses", function() {
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
					expect( TestSubModel.prototype.proxy instanceof RestProxy ).toBe( true );
				} );
				
			} );
			
			
			describe( "`change` event upon initialization", function() {
				
				var TestModel = Class.extend( Model, {
					attributes: [
						{ name: 'attribute1' },
						{ name: 'attribute2', defaultValue: "attribute2's default" },
						{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
						{ name: 'attribute4', set : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } },
						{ name: 'attribute5', set : function( model, newValue ) { return newValue + " " + newValue.get( 'attribute2' ); } }
					]
				} );
				
				
				it( "The Model should fire its 'change' event when an attribute's data is set externally", function() {
					var changeEventFired = false;
					var model = new TestModel();
					model.addListener( 'change', function() { changeEventFired = true; } );
					
					// Set the value
					model.set( 'attribute1', 'value1' );
					expect( changeEventFired ).toBe( true );  // orig YUI Test err msg: "The change event should have been fired during the set of the new data"
				} );
				
			} );
			
			
			describe( "Test that the initial default values are applied", function() {
				var TestModel = Class.extend( Model, {
					attributes: [
						{ name: 'attribute1' },
						{ name: 'attribute2', defaultValue: "attribute2's default" },
						{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
						{ name: 'attribute4', set : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } },
						{ name: 'attribute5', set : function( model, newValue ) { return newValue + " " + model.get( 'attribute2' ); } }
					]
				} );
				
				
				it( "A attribute with a defaultValue but no provided data should have its defaultValue when retrieved", function() {
					var model = new TestModel();  // no data provided
					
					expect( model.get( 'attribute2' ) ).toBe( "attribute2's default" );
				} );
				
				
				it( "A attribute with a defaultValue that is a function, but no provided data should have its defaultValue when retrieved", function() {
					var model = new TestModel();  // no data provided
					
					expect( model.get( 'attribute3' ) ).toBe( "attribute3's default" );  // attribute3 has a defaultValue that is a function
				} );
				
				
				it( "A attribute with a defaultValue and also provided data should have its provided data when retrieved", function() {
					var model = new TestModel( {
						attribute2 : "attribute2's data"
					} );
					
					expect( model.get( 'attribute2' ) ).toBe( "attribute2's data" );  // orig YUI Test err msg: "The 'default' specified on the Attribute should *not* have been applied, since it has a value."
				} );
				
			} );
			
			
			describe( "Test initial data", function() {
				
				it( "Providing initial data to the constructor should not leave the model set as 'modified' (i.e. it should have no 'changes')", function() {
					var MyModel = Model.extend( {
						attributes : [ 'attribute1', 'attribute2' ]
					} );
					
					var model = new MyModel( { attribute1: 'value1', attribute2: 'value2' } );
					expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "The model should not be modified upon initialization"
					expect( _.isEmpty( model.getChanges() ) ).toBe( true );  // orig YUI Test err msg: "There should not be any 'changes' upon initialization"
				} );

				
				it( "should throw an error if there are properties in the `data` object that don't map to model attributes, if the `ignoreUnknownAttrs` option is `false`", function() {
					var MyModel = Model.extend( {
						attributes : [ 'a', 'b' ]
					} );

					var model;
					expect( function() {
						model = new MyModel( { a: 1, b: 2, c: 3, d: 4 } );
					} ).toThrow( "data.Model.set(): An attribute with the attributeName 'c' was not found." );
					
					expect( function() {
						model = new MyModel( { a: 1, b: 2, c: 3, d: 4 }, { ignoreUnknownAttrs: false } );
					} ).toThrow( "data.Model.set(): An attribute with the attributeName 'c' was not found." );
				} );
				
					
				it( "should accept properties in the `data` object that don't map to model attributes, if the `ignoreUnknownAttrs` option is provided as `true`", function() {
					var MyModel = Model.extend( {
						attributes : [ 'a', 'b' ]
					} );
					
					var model = new MyModel( { a: 1, b: 2, c: 3, d: 4 }, { ignoreUnknownAttrs: true } );
					expect( model.get( 'a' ) ).toBe( 1 );
					expect( model.get( 'b' ) ).toBe( 2 );
				} );
				
			} );
			
			
			describe( "Test that initialize() is called upon construction", function() {
				
				it( "The initialize() method should be called during the constructor for subclasses to hook into, after model attributes have been set", function() {
					var initializeCalled = false;
					
					var MyModel = Model.extend( {
						attributes : [ 
							'test1',
							{ name: 'test2', defaultValue: 'defaultForTest2' }
						],
						initialize : function() {
							initializeCalled = true;
							
							// Check that model attributes have already been set 
							expect( this.get( 'test1' ) ).toBe( 1 );
							expect( this.get( 'test2' ) ).toBe( 2 );
						}
					} );
					
					var model = new MyModel( { test1: 1, test2: 2 } );
					expect( initializeCalled ).toBe( true );
				} );
				
			} );
			
		} );
		
		
		describe( 'getId()', function() {
			
			it( "should throw an error if the default idAttribute 'id' does not exist on the model", function() {
				expect( function() {
					var MyModel = Model.extend( {
						attributes : [
							// note: no attribute named 'id'
							'field1',
							'field2'
						]
					} );
					
					var model = new MyModel();
					model.getId();
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have errored"
				} ).toThrow( "Error: The `idAttribute` (currently set to an attribute named 'id') was not found on the Model. Set the `idAttribute` config to the name of the id attribute in the Model. The model can't be saved or destroyed without it." );
			} );
			
			
			it( "should throw an error with a custom `idAttribute` that does not relate to an attribute on the model", function() {
				expect( function() {
					var MyModel = Model.extend( {
						attributes : [
							'field1',
							'field2'
						],
						
						idAttribute: 'myIdAttribute'
					} );
					
					var model = new MyModel();
					model.getId();
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "The test should have errored"
				} ).toThrow( "Error: The `idAttribute` (currently set to an attribute named 'myIdAttribute') was not found on the Model. Set the `idAttribute` config to the name of the id attribute in the Model. The model can't be saved or destroyed without it." );
			} );
			
			
			it( "should return the value of the `idAttribute`", function() {
				var MyModel = Model.extend( {
					attributes : [ 'myIdAttribute' ],
					idAttribute: 'myIdAttribute'
				} );
				
				var model = new MyModel( {
					myIdAttribute: 1
				} );
				
				expect( model.getId() ).toBe( 1 );
			} );
			
		} );
		
		
		describe( 'getIdAttribute()', function() {
			
			it( "should return the Attribute referenced by the 'idAttribute' config", function() {
				var MyModel = Model.extend( {
					attributes: [ 'id' ],
					idAttribute: 'id'
				} );
				
				var model = new MyModel();
				expect( model.getIdAttribute() instanceof Attribute ).toBe( true );
			} );
			
			
			it( "should return null if there is no attribute referenced by the 'idAttribute' config", function() {
				var MyModel = Model.extend( {
					attributes: [ 'id' ],
					idAttribute: 'ooglyBoogly'
				} );
				
				var model = new MyModel();
				expect( model.getIdAttribute() ).toBe( null );
			} );
			
		} );
		
		
		describe( 'getIdAttributeName()', function() {
			
			it( "should return the value of the 'idAttribute' config", function() {
				var MyModel = Model.extend( {
					attributes: [ 'id' ],
					idAttribute: 'myBrandyNewIdAttribute'  // doesn't matter if there is no attribute that matches the idAttribute's name (for now...) 
				} );
				
				var model = new MyModel();
				expect( model.getIdAttributeName() ).toBe( 'myBrandyNewIdAttribute' );
			} );
			
		} );
		
		
		describe( 'hasIdAttribute()', function() {
			
			it( "should return false when the `idAttribute` config does not reference a valid Attribute", function() {
				var MyModel = Model.extend( {
					attributes  : [ 'attr' ],  // note: no "id" attribute
					idAttribute : 'id'
				} );
				
				var model = new MyModel();
				expect( model.hasIdAttribute() ).toBe( false );
			} );
			
			
			it( "should return true when the `idAttribute` config does reference a valid Attribute", function() {
				var MyModel = Model.extend( {
					attributes  : [ 'id', 'attr' ],
					idAttribute : 'id'
				} );
				
				var model = new MyModel();
				expect( model.hasIdAttribute() ).toBe( true );
			} );
			
		} );
		
		
		
		describe( 'set()', function() {
			
			var TestModel = Class.extend( Model, {
				attributes: [
					{ name: 'attribute1' },
					{ name: 'attribute2', defaultValue: "attribute2's default" },
					{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
					{ name: 'attribute4', set : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } },
					{ name: 'attribute5', set : function( model, newValue ) { return newValue + " " + model.get( 'attribute2' ); } }
				]
			} );
			
			
			function assertMixedAttributeAcceptsAll( model, attributeName ) {
				model.set( attributeName, undefined );
				expect( _.isUndefined( model.get( attributeName ) ) ).toBe( true );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() (undefined)."
				
				model.set( attributeName, null );
				expect( model.get( attributeName ) ).toBe( null );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() (null)."
				
				model.set( attributeName, true );
				expect( model.get( attributeName ) ).toBe( true );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() (true)."
				
				model.set( attributeName, false );
				expect( model.get( attributeName ) ).toBe( false );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() (false)."
				
				model.set( attributeName, 0 );
				expect( model.get( attributeName ) ).toBe( 0 );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() (0)."
				
				model.set( attributeName, 1 );
				expect( model.get( attributeName ) ).toBe( 1 );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() (1)."
				
				model.set( attributeName, "" );
				expect( model.get( attributeName ) ).toBe( "" );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() ('')."
				
				model.set( attributeName, "Hello" );
				expect( model.get( attributeName ) ).toBe( "Hello" );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() ('Hello')."
				
				model.set( attributeName, {} );
				expect( _.isObject( model.get( attributeName ) ) ).toBe( true );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() (object)."
				
				model.set( attributeName, [] );
				expect( _.isArray( model.get( attributeName ) ) ).toBe( true );  // orig YUI Test err msg: attributeName + "'s value should have the value set by set() (array)."
			}

			
			// ----------------------------------
			
			// Test unknown attributes being provided to the method
			
			it( "should throw an error when trying to set an attribute that isn't defined (using the attrName and value args)", function() {
				var model = new TestModel();
				
				expect( function() {
					model.set( 'nonExistentAttr', 1 );
				} ).toThrow( "data.Model.set(): An attribute with the attributeName 'nonExistentAttr' was not found." );
			} );
			
			
			it( "should *not* throw an error when trying to set an attribute that isn't defined (using the attrName and value args), and the `ignoreUnknownAttrs` method option is set to `true`", function() {
				var model = new TestModel();
				
				// Following line simply should not throw an error
				model.set( 'nonExistentAttr', 1, { ignoreUnknownAttrs: true } );
			} );
			
			
			it( "should throw an error when trying to set an attribute that isn't defined (using the attrName and value args), when the `ignoreUnknownAttrs` option is passed explicitly as `false`", function() {
				var model = new TestModel();
				
				expect( function() {
					model.set( 'nonExistentAttr', 1, { ignoreUnknownAttrs: false } );
				} ).toThrow( "data.Model.set(): An attribute with the attributeName 'nonExistentAttr' was not found." );
			} );
			
			
			it( "should throw an error when trying to set an attribute that isn't defined (using the attrName arg as an anonymous object)", function() {
				expect( function() {
					var model = new TestModel();
					model.set( { 'nonExistentAttr': 1 } );
				} ).toThrow( "data.Model.set(): An attribute with the attributeName 'nonExistentAttr' was not found." );
			} );
			
			
			it( "should *not* throw an error when trying to set an attribute that isn't defined (using the attrName arg as an anonymous object), and the `ignoreUnknownAttrs` method option is set to `true`", function() {
				var model = new TestModel();
				
				// Following line simply should not throw an error
				model.set( { 'nonExistentAttr': 1 }, { ignoreUnknownAttrs: true } );
			} );
			
			
			it( "should throw an error when trying to set an attribute that isn't defined (using the attrName arg as an anonymous object), when the `ignoreUnknownAttrs` option is passed explicitly as `false`", function() {
				var model = new TestModel();
				
				expect( function() {
					model.set( { 'nonExistentAttr': 1 }, { ignoreUnknownAttrs: false } );
				} ).toThrow( "data.Model.set(): An attribute with the attributeName 'nonExistentAttr' was not found." );
			} );
			
			
			// ----------------------------------
			
			
			it( "should accept all datatypes including falsy values", function() {
				var model = new TestModel();
				
				assertMixedAttributeAcceptsAll( model, 'attribute1' );
			} );
			
			
			it( "should accept all datatypes, and still work even with a default value", function() {
				// Test with regular values, given a default value
				var model = new TestModel();
				
				assertMixedAttributeAcceptsAll( model, 'attribute2' );  // attribute2 has a default value
			} );
			
			
			it( "should accept all datatypes, and still work even with a given value", function() {
				// Test with regular values, given a default value
				var model = new TestModel( {
					attribute2 : "initial value"
				} );
				
				assertMixedAttributeAcceptsAll( model, 'attribute2' );  // attribute2 has a given value in this test ("initial value")
			} );
			
			
			it( "After the successful set() of an attribute, the Model should be considered modified", function() {
				var TestModel = Model.extend( {
					attributes: [ 'attribute1' ]
				} );
				var model = new TestModel();
				
				expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "Initially, the model should not be considered modified"
				
				model.set( 'attribute1', 'value1' );
				expect( model.isModified() ).toBe( true );  // orig YUI Test err msg: "After a set, the model should now be considered modified"
			} );
			
			
			it( "After a set() of an attribute to the same value from a clean state, the Model should NOT be considered modified (as the value didn't change)", function() {
				var TestModel = Model.extend( {
					attributes: [ 'attribute1' ]
				} );
				var model = new TestModel( { attribute1: 'value1' } );  // initial data, model not considered modified
				
				expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "Initially, the model should not be considered modified"
				
				// Set to the same value
				model.set( 'attribute1', 'value1' );
				expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "After a set to the *same value*, the model should not be considered modified (as the value didn't change)"
			} );
			
			
			it( "should not re-set an attribute to the same value from the initial value provided to the constructor", function() {
				var changeCount = 0;
				
				var TestModel = Model.extend( {
					attributes: [ 'attribute1' ]
				} );
				
				var model = new TestModel( { attribute1: 'value1' } );
				model.addListener( 'change:attribute1', function() { changeCount++; } );
				
				// Set to the same value
				model.set( 'attribute1', 'value1' );
				expect( changeCount ).toBe( 0 );  // orig YUI Test err msg: "The attribute should not have been registered as 'changed' when providing the same value"
			} );
			
			
			it( "should not re-set an attribute to the same value", function() {
				var changeCount = 0;
				
				var TestModel = Model.extend( {
					attributes: [ 'attribute1' ]
				} );
				
				var model = new TestModel();
				model.addListener( 'change:attribute1', function() { changeCount++; } );
				
				// Set for the first time
				model.set( 'attribute1', 'value1' );
				expect( changeCount ).toBe( 1 );  // orig YUI Test err msg: "Initially, the attribute should have been changed exactly once."
				
				// Set the second time to the same value
				model.set( 'attribute1', 'value1' );
				expect( changeCount ).toBe( 1 );  // orig YUI Test err msg: "The attribute should not have been registered as 'changed' the second time. Should still only have '1 change'."
			} );
			
			
			it( "should run the Attribute's set() method on an attribute that has initial data of its own", function() {
				var TestModel = Class.extend( Model, {
					attributes: [
						{ name: 'attribute1' },
						{ name: 'attribute2', set : function( model, newValue ) { return newValue + " " + model.get( 'attribute1' ); } }
					]
				} );
				var model = new TestModel( {
					attribute1 : "attribute1val",
					attribute2 : "attribute2val"
				} );
				
				expect( model.get( 'attribute2' ) ).toBe( "attribute2val attribute1val" );  // orig YUI Test err msg: "attribute2 should be the concatenation of its own value, a space, and attribute1"
			} );
			
			
			it( "should convert an attribute with a 'set' function when it is set() again", function() {
				var TestModel = Class.extend( Model, {
					attributes: [
						{ name: 'attribute1' },
						{ name: 'attribute2', set : function( model, newValue ) { return newValue + " " + model.get( 'attribute1' ); } }
					]
				} );
				var model = new TestModel( {
					attribute1 : "attribute1val",
					attribute2 : "attribute2val"
				} );
				
				// This call should cause attribute2's set() function to run
				model.set( 'attribute2', "newattribute2value" );
				
				expect( model.get( 'attribute2' ) ).toBe( "newattribute2value attribute1val" );  // orig YUI Test err msg: "attribute2 should be the concatenation of its own value, a space, and attribute2"
			} );
			
			
			it( "When set() is provided an Object (map) of data to set, the attributes with user-provided 'set' methods should be run after ones with out any (in case they rely on the ones without setters)", function() {
				var TestModel = Model.extend( {
					attributes : [
						{ name: 'attr_with_setter1', set: function( model, value ) { return model.get( 'attr_without_setter' ) + value; } },
						{ name: 'attr_without_setter' },
						{ name: 'attr_with_setter2', set: function( model, value ) { return model.get( 'attr_without_setter' ) + value; } }
					]
				} );
				
				var model = new TestModel();
				model.set( {
					attr_with_setter1: 1,
					attr_without_setter: 2,
					attr_with_setter2: 3
				} );
				
				expect( model.get( 'attr_with_setter1' ) ).toBe( 3 );  // orig YUI Test err msg: "The value should have been added from the attr_without_setter"
				expect( model.get( 'attr_without_setter' ) ).toBe( 2 );  // orig YUI Test err msg: "The value should have been simply provided to attr_without_setter"
				expect( model.get( 'attr_with_setter2' ) ).toBe( 5 );  // orig YUI Test err msg: "The value should have been added from the attr_without_setter"
			} );
			
			
			it( "should delegate to the Attribute's set() and afterSet() methods to do any processing and post-processing needed for the value", function() {
				var setValue, 
				    afterSetValue;
				
				var TestAttribute = Attribute.extend( {
					set : function( model, newValue, oldValue ) {
						return ( setValue = newValue + 1 );
					},
					afterSet : function( model, newValue ) {
						return ( afterSetValue = newValue + 20 );
					}
				} );
				
				var TestModel = Model.extend( {
					attributes : [
						new TestAttribute( {
							name : 'attr1'
						} )
					]
				} );
				
				var model = new TestModel( { attr1: 0 } );
				
				expect( setValue ).toBe( 1 );
				expect( afterSetValue ).toBe( 21 );
			} );
			
			
			it( "When an attribute is set, a generalized 'change' event should be fired", function() {
				var TestModel = Class.extend( Model, {
					attributes: [ 'attribute1', 'attribute2' ]
				} );
				var model = new TestModel(),
				    changeEventCount = 0;
				    
				model.addListener( 'change', function( model, attributeName, newValue, oldValue ) {
					changeEventCount++;
						
					expect( attributeName ).toBe( "attribute2" );
					expect( newValue ).toBe( "brandNewValue" );
					expect( oldValue ).toBeUndefined();  // no old value
				} );
				
				model.set( 'attribute2', "brandNewValue" );
				expect( changeEventCount ).toBe( 1 );  // make sure the event was fired exactly once
			} );
			
			
			it( "When an attribute is set, a 'change:xxx' event should be fired for the changed attribute", function() {
				var TestModel = Class.extend( Model, {
					attributes: [ 'attribute1', 'attribute2' ]
				} );
				var model = new TestModel(),
				    changeEventCount = 0;
				    
				model.addListener( 'change:attribute2', function( model, newValue, oldValue ) {
					changeEventCount++;
					
					expect( newValue ).toBe( "brandNewValue" );
					expect( oldValue ).toBeUndefined( true );
				} );
				
				model.set( 'attribute2', "brandNewValue" );
				expect( changeEventCount ).toBe( 1 );  // make sure the event was fired exactly once
			} );
			
			
			it( "When an attribute with a `set()` function of its own is set, the 'change' events should be fired", function() {
				var TestModel = Class.extend( Model, {
					attributes: [ 
						{ 
							// Attribute with a set() function that returns a new value
							name : 'attribute1',
							set : function( model, value ) { 
								return value;
							}
						},
						{ 
							// Attribute with a set() function that does not return a new value (presumably modifying some other Attribute in the model),
							// and therefore does not have a new value set to the underlying data
							name : 'attribute2', 
							set : function( model, value ) {
								// Presumably updating some other Attribute in the model
							}
						} 
					]
				} );
				
				var model = new TestModel(),
				    attribute1ChangeCount = 0,
				    attribute1ChangeEventValue,
				    attribute2ChangeCount = 0,
				    attribute2ChangeEventValue;
				    
				model.addListener( 'change:attribute1', function( model, value ) {
					attribute1ChangeCount++;
					attribute1ChangeEventValue = value;
				} );
				model.addListener( 'change:attribute2', function( model, value ) {
					attribute2ChangeCount++;
					attribute2ChangeEventValue = value;
				} );
				
				
				// Test changing the attribute with a set() function that returns a new value
				model.set( 'attribute1', 'attribute1value1' );
				expect( attribute1ChangeCount ).toBe( 1 );
				expect( attribute2ChangeCount ).toBe( 0 );
				expect( attribute1ChangeEventValue ).toBe( 'attribute1value1' );
				
				model.set( 'attribute1', 'attribute1value2' );
				expect( attribute1ChangeCount ).toBe( 2 );
				expect( attribute2ChangeCount ).toBe( 0 );
				expect( attribute1ChangeEventValue ).toBe( 'attribute1value2' );
				
				model.set( 'attribute1', 'attribute1value2' );  // setting to the SAME value, to make sure a new 'change' event has not been fired
				expect( attribute1ChangeCount ).toBe( 2 );
				expect( attribute2ChangeCount ).toBe( 0 );
				
				
				// Test changing the attribute with a set() function that does *not* return a new value (which makes the model not store
				// any new value on its underlying data hash)
				model.set( 'attribute2', 'attribute2value1' );
				expect( attribute1ChangeCount ).toBe( 2 );
				expect( attribute2ChangeCount ).toBe( 1 );
				expect( attribute2ChangeEventValue ).toBeUndefined();
				
				model.set( 'attribute2', 'attribute2value2' );
				expect( attribute1ChangeCount ).toBe( 2 );
				expect( attribute2ChangeCount ).toBe( 2 );
				expect( attribute2ChangeEventValue ).toBe();
			} );
			
			
			it( "When an attribute with only a `get()` function is set, the 'change' events should be fired with the value from the get function, not the raw value (for both the newValue, and oldValue)", function() {
				var TestModel = Class.extend( Model, {
					attributes: [
						{
							name : 'myAttribute',
							get : function( model, value ) { return value + 10; } // add 10, to make sure we're using the getter
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
				
				expect( changeEventNewValue ).toBe( 52 );  // orig YUI Test err msg: "The newValue provided with the change event should have come from myAttribute's `get()` function"
				expect( changeEventOldValue ).toBe( 20 );  // orig YUI Test err msg: "The oldValue provided with the change event should have come from myAttribute's `get()` function"
				expect( attributeSpecificChangeEventNewValue ).toBe( 52 );  // orig YUI Test err msg: "The newValue provided with the attribute-specific change event should have come from myAttribute's `get()` function"
				expect( attributeSpecificChangeEventOldValue ).toBe( 20 );  // orig YUI Test err msg: "The oldValue provided with the attribute-specific change event should have come from myAttribute's `get()` function"
			} );
			
			
			it( "When an attribute with both a `set()` function, and `get()` function of its own is set, the 'change' events should be fired with the value from the `get()` function, not the raw value", function() {
				var TestModel = Class.extend( Model, {
					attributes: [ 
						'baseAttribute',
						{
							// Computed Attribute with both a set() function and a get() function, which simply uses 'baseAttribute' for its value
							// (which in practice, would probably be composed of two or more attributes, and possible does calculations as well)
							name : 'computedAttribute',
							set : function( model, value ) { model.set( 'baseAttribute', value ); },
							get : function( model, value ) { return model.get( 'baseAttribute' ) + 10; }   // add 10, to make sure we're using the getter
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
								
				
				expect( changeEventNewValue ).toBe( 52 );  // orig YUI Test err msg: "The newValue provided with the change event should have come from computedAttribute's `get()` function"
				expect( changeEventOldValue ).toBe( 20 );  // orig YUI Test err msg: "The oldValue provided with the change event should have come from computedAttribute's `get()` function"
				expect( attributeSpecificChangeEventNewValue ).toBe( 52 );  // orig YUI Test err msg: "The newValue provided with the attribute-specific change event should have come from computedAttribute's `get()` function"
				expect( attributeSpecificChangeEventOldValue ).toBe( 20 );  // orig YUI Test err msg: "The oldValue provided with the attribute-specific change event should have come from computedAttribute's `get()` function"
			} );
			
			
			it( "When multiple attributes are set, a generalized 'changeset' event should be fired exactly once", function() {
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
				expect( model.get( 'a' ) ).toBe( 1 );  // orig YUI Test err msg: "initial value for a"
				expect( model.get( 'b' ) ).toBe( 2 );  // orig YUI Test err msg: "initial value for b"
				expect( model.get( 'c' ) ).toBe( 3 );  // orig YUI Test err msg: "initial value for c"
				    
				model.addListener( 'changeset', function( model, newValues, oldValues ) {
					changeSetEventCount++;
					changeSetNewValues = newValues;
					changeSetOldValues = oldValues;
				} );
				
				// Modify attr1, attr2, and attr3
				model.set( { 'a': 11, 'b': 22, 'c': 33 } );
				expect( changeSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'changeset' event should have been fired exactly once"
				
				expect( _.keys( changeSetNewValues ).length ).toBe( 3 );  // orig YUI Test err msg: "The changeset's newValues should have exactly 3 properties"
				expect( _.keys( changeSetOldValues ).length ).toBe( 3 );  // orig YUI Test err msg: "The changeset's oldValues should have exactly 3 properties"
				
				expect( changeSetNewValues.a ).toBe( 11 );  // orig YUI Test err msg: "newValue for 'a'"
				expect( changeSetNewValues.b ).toBe( 22 );  // orig YUI Test err msg: "newValue for 'b'"
				expect( changeSetNewValues.c ).toBe( 33 );  // orig YUI Test err msg: "newValue for 'c'"
				
				expect( changeSetOldValues.a ).toBe( 1 );  // orig YUI Test err msg: "oldValue for 'a'"
				expect( changeSetOldValues.b ).toBe( 2 );  // orig YUI Test err msg: "oldValue for 'b'"
				expect( changeSetOldValues.c ).toBe( 3 );  // orig YUI Test err msg: "oldValue for 'c'"
			} );
			
			
			it( "When a computed attribute changes other attributes, the generalized 'changeset' event should still be only fired exactly once", function() {
				var TestModel = Class.extend( Model, {
					attributes: [ 
						{ 
							name : 'a', 
							set : function( model, value ) {
								model.set( 'b', value + 1 );
								model.set( 'c', value + 2 );
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
				expect( model.get( 'a' ) ).toBe( 1 );  // orig YUI Test err msg: "initial value for a"
				expect( model.get( 'b' ) ).toBe( 2 );  // orig YUI Test err msg: "initial value for b. Should be set by the 'a' attribute's setter"
				expect( model.get( 'c' ) ).toBe( 3 );  // orig YUI Test err msg: "initial value for c. Should be set by the 'a' attribute's setter"
				
				model.addListener( 'changeset', function( model, newValues, oldValues ) {
					changeSetEventCount++;
					changeSetNewValues = newValues;
					changeSetOldValues = oldValues;
				} );
				
				model.set( 'a', 11 );
				expect( changeSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'changeset' event should have been fired exactly once"
				
				// Double check the 'a', 'b', and 'c' attributes have been changed
				expect( model.get( 'a' ) ).toBe( 11 );
				expect( model.get( 'b' ) ).toBe( 12 );
				expect( model.get( 'c' ) ).toBe( 13 );
				
				expect( _.keys( changeSetNewValues ).length ).toBe( 3 );  // orig YUI Test err msg: "The changeset's newValues should have exactly 3 properties"
				expect( _.keys( changeSetOldValues ).length ).toBe( 3 );  // orig YUI Test err msg: "The changeset's oldValues should have exactly 3 properties"
				
				expect( changeSetNewValues.a ).toBe( 11 );  // orig YUI Test err msg: "newValue for 'a'"
				expect( changeSetNewValues.b ).toBe( 12 );  // orig YUI Test err msg: "newValue for 'b'"
				expect( changeSetNewValues.c ).toBe( 13 );  // orig YUI Test err msg: "newValue for 'c'"
				
				expect( changeSetOldValues.a ).toBe( 1 );  // orig YUI Test err msg: "oldValue for 'a'"
				expect( changeSetOldValues.b ).toBe( 2 );  // orig YUI Test err msg: "oldValue for 'b'"
				expect( changeSetOldValues.c ).toBe( 3 );  // orig YUI Test err msg: "oldValue for 'c'"
			} );
			
			
			it( "When an attribute changes, and a handler of the change ends up setting other attributes, the generalized 'changeset' event should still be only fired exactly once", function() {
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
				expect( model.get( 'a' ) ).toBe( 1 );  // orig YUI Test err msg: "initial value for a"
				expect( model.get( 'b' ) ).toBe( 2 );  // orig YUI Test err msg: "initial value for b"
				expect( model.get( 'c' ) ).toBe( 3 );  // orig YUI Test err msg: "initial value for c"
				
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
				expect( changeSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'changeset' event should have been fired exactly once"
				
				// Double check the 'a', 'b', and 'c' attributes have been changed
				expect( model.get( 'a' ) ).toBe( 11 );
				expect( model.get( 'b' ) ).toBe( 22 );
				expect( model.get( 'c' ) ).toBe( 33 );
				
				expect( _.keys( changeSetNewValues ).length ).toBe( 3 );  // orig YUI Test err msg: "The changeset's newValues should have exactly 3 properties"
				expect( _.keys( changeSetOldValues ).length ).toBe( 3 );  // orig YUI Test err msg: "The changeset's oldValues should have exactly 3 properties"
				
				expect( changeSetNewValues.a ).toBe( 11 );  // orig YUI Test err msg: "newValue for 'a'"
				expect( changeSetNewValues.b ).toBe( 22 );  // orig YUI Test err msg: "newValue for 'b'"
				expect( changeSetNewValues.c ).toBe( 33 );  // orig YUI Test err msg: "newValue for 'c'"
				
				expect( changeSetOldValues.a ).toBe( 1 );  // orig YUI Test err msg: "oldValue for 'a'"
				expect( changeSetOldValues.b ).toBe( 2 );  // orig YUI Test err msg: "oldValue for 'b'"
				expect( changeSetOldValues.c ).toBe( 3 );  // orig YUI Test err msg: "oldValue for 'c'"
			} );
			
			
			it( "When an attribute is changed multiple times within a single 'changeset', its oldValue value should have its *original* value (not any intermediate values)", function() {
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
				expect( model.get( 'a' ) ).toBe( 1 );  // orig YUI Test err msg: "initial value for a"
				
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
				expect( changeSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'changeset' event should have been fired exactly once"
				
				// Double check the 'a' attribute has been changed to the last set value
				expect( model.get( 'a' ) ).toBe( 4 );
				
				expect( _.keys( changeSetNewValues ).length ).toBe( 1 );  // orig YUI Test err msg: "The changeset's newValues should have exactly 1 property"
				expect( _.keys( changeSetOldValues ).length ).toBe( 1 );  // orig YUI Test err msg: "The changeset's oldValues should have exactly 1 property"
				
				expect( changeSetNewValues.a ).toBe( 4 );  // orig YUI Test err msg: "newValue for 'a'"
				expect( changeSetOldValues.a ).toBe( 1 );  // orig YUI Test err msg: "oldValue for 'a'"
			} );
			
			
			it( "multiple 'changeset' events should work correctly, providing the correct newValues and oldValues each time", function() {
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
				expect( model.get( 'a' ) ).toBe( 1 );  // orig YUI Test err msg: "initial value for a"
				expect( model.get( 'b' ) ).toBe( 2 );  // orig YUI Test err msg: "initial value for b"
				expect( model.get( 'c' ) ).toBe( 3 );  // orig YUI Test err msg: "initial value for c"
				
				// Now add the 'changeset' listener for the results of the test
				model.addListener( 'changeset', function( model, newValues, oldValues ) {
					changeSetEventCount++;
					changeSetNewValues = newValues;
					changeSetOldValues = oldValues;
				} );
				
				model.set( { 'a': 11, 'b': 22, 'c': 33 } );
				expect( changeSetEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'changeset' event should have been fired exactly once"
				
				// Double check the 'a', 'b', and 'c' attributes have been changed
				expect( model.get( 'a' ) ).toBe( 11 );
				expect( model.get( 'b' ) ).toBe( 22 );
				expect( model.get( 'c' ) ).toBe( 33 );
				
				expect( _.keys( changeSetNewValues ).length ).toBe( 3 );  // orig YUI Test err msg: "The changeset's newValues should have exactly 3 properties"
				expect( _.keys( changeSetOldValues ).length ).toBe( 3 );  // orig YUI Test err msg: "The changeset's oldValues should have exactly 3 properties"
				
				expect( changeSetNewValues.a ).toBe( 11 );  // orig YUI Test err msg: "newValue for 'a'"
				expect( changeSetNewValues.b ).toBe( 22 );  // orig YUI Test err msg: "newValue for 'b'"
				expect( changeSetNewValues.c ).toBe( 33 );  // orig YUI Test err msg: "newValue for 'c'"
				
				expect( changeSetOldValues.a ).toBe( 1 );  // orig YUI Test err msg: "oldValue for 'a'"
				expect( changeSetOldValues.b ).toBe( 2 );  // orig YUI Test err msg: "oldValue for 'b'"
				expect( changeSetOldValues.c ).toBe( 3 );  // orig YUI Test err msg: "oldValue for 'c'"
				
				
				// Now just change 'b' and 'c' manually
				model.set( { 'b': 222, 'c': 333 } );
				expect( changeSetEventCount ).toBe( 2 );  // orig YUI Test err msg: "The 'changeset' event should have been fired exactly twice at this point (one more than the last test)"
				
				// Double check the 'b', and 'c' attributes have been changed (and that 'a' hasn't)
				expect( model.get( 'a' ) ).toBe( 11 );
				expect( model.get( 'b' ) ).toBe( 222 );
				expect( model.get( 'c' ) ).toBe( 333 );
				
				expect( _.keys( changeSetNewValues ).length ).toBe( 2 );  // orig YUI Test err msg: "The changeset's newValues should have exactly 2 properties"
				expect( _.keys( changeSetOldValues ).length ).toBe( 2 );  // orig YUI Test err msg: "The changeset's oldValues should have exactly 2 properties"
				
				expect( changeSetNewValues.b ).toBe( 222 );  // orig YUI Test err msg: "newValue for 'b'"
				expect( changeSetNewValues.c ).toBe( 333 );  // orig YUI Test err msg: "newValue for 'c'"
				
				expect( changeSetOldValues.b ).toBe( 22 );  // orig YUI Test err msg: "oldValue for 'b'"
				expect( changeSetOldValues.c ).toBe( 33 );  // orig YUI Test err msg: "oldValue for 'c'"
			} );
			
		} );
		
		
		
		describe( 'get()', function() {
			var TestModel = Class.extend( Model, {
				attributes: [
					{ name: 'attribute1' },
					{ name: 'attribute2', defaultValue: "attribute2's default" },
					{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
					{ name: 'attribute4', set : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } },
					{ name: 'attribute5', get : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } }
				]
			} );
			
			
			it( "running get() on an attribute with no initial value and no default value should return undefined", function() {
				var model = new TestModel();
				expect( _.isUndefined( model.get( 'attribute1' ) ) ).toBe( true );  // attribute1 has no default value
			} );
			
			
			it( "running get() on an attribute with an initial value and no default value should return the initial value", function() {
				var model = new TestModel( {
					attribute1 : "initial value"
				} );
				expect( model.get( 'attribute1' ) ).toBe( "initial value" );  // attribute1 has no default value
			} );
			
			
			it( "running get() on an attribute with no initial value but does have a default value should return the default value", function() {
				var model = new TestModel();
				expect( model.get( 'attribute2' ) ).toBe( "attribute2's default" );  // attribute2 has a default value
			} );
			
			
			it( "running get() on an attribute with an initial value and a default value should return the initial value", function() {
				var model = new TestModel( {
					attribute2 : "initial value"
				} );
				expect( model.get( 'attribute2' ) ).toBe( "initial value" );  // attribute2 has a default value
			} );
			
			
			it( "running get() on an attribute with no initial value but does have a default value which is a function should return the default value", function() {
				var model = new TestModel();
				expect( model.get( 'attribute3' ) ).toBe( "attribute3's default" );  // attribute3 has a defaultValue that is a function
			} );
			
			
			it( "running get() on an attribute with a `get` function defined should return the value that the `get` function returns", function() {
				var model = new TestModel( { attribute1: 'value1' } );
				expect( model.get( 'attribute5' ) ).toBe( "value1 attribute2's default" );
			} );
			
		} );
		
		
		
		describe( 'raw()', function() {
			var TestModel = Class.extend( Model, {
				attributes: [
					{ name: 'attribute1' },
					{ name: 'attribute2', defaultValue: "attribute2's default" },
					{ 
						name: 'attribute3', 
						get : function( model, newValue ) { 
							return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); 
						} 
					},
					{ 
						name: 'attribute4', 
						raw : function( model, newValue ) { 
							return newValue + " " + model.get( 'attribute1' );
						} 
					}
				]
			} );
			
			
			it( "running raw() on an attribute with no initial value and no default value should return undefined", function() {
				var model = new TestModel();
				expect( _.isUndefined( model.raw( 'attribute1' ) ) ).toBe( true );  // attribute1 has no default value
			} );
			
			
			it( "running raw() on an attribute with an initial value and no default value should return the initial value", function() {
				var model = new TestModel( {
					attribute1 : "initial value"
				} );
				expect( model.raw( 'attribute1' ) ).toBe( "initial value" );  // attribute1 has no default value
			} );
			
			
			it( "running raw() on an attribute with no initial value but does have a default value should return the default value", function() {
				var model = new TestModel();
				expect( model.raw( 'attribute2' ) ).toBe( "attribute2's default" );  // attribute2 has a default value
			} );
			
			
			it( "running raw() on an attribute with a `get` function defined should return the *underlying* value, not the value that the `get` function returns", function() {
				var model = new TestModel( { attribute3: 'value1' } );
				expect( model.raw( 'attribute3' ) ).toBe( "value1" );
			} );
			
			
			it( "running raw() on an attribute with a `raw` function defined should return the value that the `raw` function returns", function() {
				var model = new TestModel( { 
					attribute1: 'value1',
					attribute4: 'value4'
				} );
				expect( model.raw( 'attribute4' ) ).toBe( "value4 value1" );
			} );
			
		} );
		
		
		describe( 'getDefault()', function() {
			var TestModel = Class.extend( Model, {
				attributes: [
					{ name: 'attribute1' },
					{ name: 'attribute2', defaultValue: "attribute2's default" },
					{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
					{ name: 'attribute4', set : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } },
					{ name: 'attribute5', set : function( model, newValue ) { return newValue + " " + model.get( 'attribute2' ); } }
				]
			} );
			
			
			it( "A attribute with no defaultValue should return undefined when trying to retrieve its default value", function() {
				var model = new TestModel();
				expect( _.isUndefined( model.getDefault( 'attribute1' ) ) ).toBe( true );  // attribute1 has no default value
			} );
			
			
			it( "A defaultValue should be able to be retrieved directly when the attribute has one", function() {
				var model = new TestModel();
				expect( model.getDefault( 'attribute2' ) ).toBe( "attribute2's default" );  // attribute2 has a defaultValue of a string
			} );
			
			
			it( "A defaultValue should be able to be retrieved directly when the defaultValue is a function that returns its default", function() {
				var model = new TestModel();
				expect( model.getDefault( 'attribute3' ) ).toBe( "attribute3's default" );  // attribute2 has a defaultValue that is a function that returns a string
			} );
			
		} );
		
		
		describe( 'isModified()', function() {
			var TestModel = Class.extend( Model, {
				attributes: [
					{ name: 'attribute1' },
					{ name: 'attribute2', defaultValue: "attribute2's default" },
					{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
					{ name: 'attribute4', set : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } },
					{ name: 'attribute5', set : function( model, newValue ) { return newValue + " " + model.get( 'attribute2' ); } }
				]
			} );
			
			
			it( "should return false if there are no changes on the model", function() {
				var model = new TestModel();
				
				expect( model.isModified() ).toBe( false );
			} );
			
			
			it( "should return true if there is at least one change on the model", function() {
				var model = new TestModel();
				model.set( 'attribute1', 'newValue1' );
				
				expect( model.isModified() ).toBe( true );
			} );
			
			
			it( "should return true if there are multiple changes on the model", function() {
				var model = new TestModel();
				model.set( 'attribute1', 'newValue1' );
				model.set( 'attribute2', 'newValue2' );
				
				expect( model.isModified() ).toBe( true );
			} );
			
			
			it( "isModified() should return false for particular attributes that have not been changed, even if there are other changes", function() {
				var model = new TestModel();
				model.set( 'attribute3', 'testing123' );
				
				expect( model.isModified( 'attribute1' ) ).toBe( false );  // orig YUI Test err msg: "attribute1, with no defaultValue, should not be modified"
				expect( model.isModified( 'attribute2' ) ).toBe( false );  // orig YUI Test err msg: "attribute2, with a defaultValue, should not be modified"
			} );
			
			
			it( "isModified() should return true for particular attributes that have been changed", function() {
				var model = new TestModel();
				
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				expect( model.isModified( 'attribute1' ) ).toBe( true );  // orig YUI Test err msg: "attribute1 should be marked as modified"
				expect( model.isModified( 'attribute2' ) ).toBe( true );  // orig YUI Test err msg: "attribute2 should be marked as modified"
			} );
			
			
			it( "isModified() should return false for particular attributes that have been changed, but then committed", function() {
				var model = new TestModel();
				
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				model.commit();
				expect( model.isModified( 'attribute1' ) ).toBe( false );  // orig YUI Test err msg: "attribute1 should have been committed, and therefore not marked as modified"
				expect( model.isModified( 'attribute2' ) ).toBe( false );  // orig YUI Test err msg: "attribute2 should have been committed, and therefore not marked as modified"
			} );
			
			
			it( "isModified() should return false for particular attributes that have been changed, but then rolled back", function() {
				var model = new TestModel();
				
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				model.rollback();
				expect( model.isModified( 'attribute1' ) ).toBe( false );  // orig YUI Test err msg: "attribute1 should have been rolled back, and therefore not marked as modified"
				expect( model.isModified( 'attribute2' ) ).toBe( false );  // orig YUI Test err msg: "attribute2 should have been rolled back, and therefore not marked as modified"
			} );
			
			
			it( "In the case of embedded DataComponents, the parent model should be considered 'modified' when a child embedded DataComponent has changes", function() {
				var ParentModel = Model.extend( {
					attributes : [
						new ConcreteDataComponentAttribute( { name: 'child', embedded: true } )
					]
				} );
				
				var childDataComponent = JsMockito.mock( ConcreteDataComponent );
				JsMockito.when( childDataComponent ).isModified().thenReturn( true );
				
				var parentModel = new ParentModel( {
					child: childDataComponent
				} );
				
				expect( parentModel.isModified() ).toBe( true );  // orig YUI Test err msg: "The parent model should be considered 'modified' while its child model is 'modified'"
				expect( parentModel.isModified( 'child' ) ).toBe( true );  // orig YUI Test err msg: "The 'child' attribute should be considered 'modified'"
			} );
			
			
			it( "The parent model should *not* have changes when a child model has changes, but is not 'embedded'", function() {
				var ParentModel = Model.extend( {
					attributes : [
						new ConcreteDataComponentAttribute( { name: 'child', embedded: false } )  // note: NOT embedded
					]
				} );
				
				var childDataComponent = JsMockito.mock( ConcreteDataComponent );
				JsMockito.when( childDataComponent ).isModified().thenReturn( true );
				
				var parentModel = new ParentModel( {
					child: childDataComponent
				} );
				
				expect( parentModel.isModified() ).toBe( false );  // orig YUI Test err msg: "The parent model should not be considered 'modified' even though its child model is 'modified', because the child is not 'embedded'"
			} );
			
			
			it( "If the persistedOnly option is provided as true, isModified() should return true only if a persisted attribute is modified", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name : 'persistedAttr', type: 'string' },
						{ name : 'unpersistedAttr', type: 'string', persist: false }
					]
				} );
				
				var model = new MyModel();
				
				expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the model should not be considered modified"
				
				model.set( 'unpersistedAttr', 'value1' );
				expect( model.isModified() ).toBe( true );  // orig YUI Test err msg: "The model should be considered 'modified' in general"
				expect( model.isModified( { persistedOnly: true } ) ).toBe( false );  // orig YUI Test err msg: "The model only has unpersisted attributes modified, so this call should return false"
				
				model.set( 'persistedAttr', 'value1' );
				expect( model.isModified() ).toBe( true );  // orig YUI Test err msg: "The model should still be considered 'modified' in general"
				expect( model.isModified( { persistedOnly: true } ) ).toBe( true );  // orig YUI Test err msg: "The model now has a persisted attribute that is modified. This should return true."
			} );
			
			
			it( "If the persistedOnly option is provided as true and a specific attribute name is given, isModified() should return true only if the attribute is both modified, and persisted", function() {
				var MyModel = Model.extend( {
					attributes : [
						{ name : 'persistedAttr', type: 'string' },
						{ name : 'unpersistedAttr', type: 'string', persist: false }
					]
				} );
				
				var model = new MyModel();
				
				expect( model.isModified( 'persistedAttr' ) ).toBe( false );  // orig YUI Test err msg: "Initial condition: the 'persistedAttr' should not be considered modified"
				expect( model.isModified( 'unpersistedAttr' ) ).toBe( false );  // orig YUI Test err msg: "Initial condition: the 'unpersistedAttr' should not be considered modified"
				
				model.set( 'unpersistedAttr', 'value1' );
				expect( model.isModified( 'unpersistedAttr' ) ).toBe( true );  // orig YUI Test err msg: "The 'unpersistedAttr' should be considered 'modified' in general"
				expect( model.isModified( 'unpersistedAttr', { persistedOnly: true } ) ).toBe( false );  // orig YUI Test err msg: "The 'unpersistedAttr' is not persisted, so this call should return false, even though it has been changed"
				
				model.set( 'persistedAttr', 'value1' );
				expect( model.isModified( 'persistedAttr' ) ).toBe( true );  // orig YUI Test err msg: "The 'persistedAttr' should still be considered 'modified' in general"
				expect( model.isModified( 'persistedAttr', { persistedOnly: true } ) ).toBe( true );  // orig YUI Test err msg: "The 'persistedAttr' is both modified, and persisted. This should return true."
			} );
			
		} );
		
		
		describe( 'getChanges()', function() {
			
			xit( "getChanges() should delegate to the singleton NativeObjectConverter to create an Object representation of its data, but only provide changed attributes for the attributes that should be returned", function() {
				var MyModel = Model.extend( {
					attributes: [ 
						'attr1', 
						'attr2', 
						'attr3',
						new ConcreteDataComponentAttribute( { name: 'nestedDataComponent', embedded: false } ),  // this one NOT embedded
						new ConcreteDataComponentAttribute( { name: 'embeddedDataComponent', embedded: true } )  // this one IS embedded
					]
				} );
				
				
				var mockDataComponent = JsMockito.mock( ConcreteDataComponent );
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
				
				//var optionsProvidedToConvert = thisSuite.args[ 1 ];  // defined in the setUp method
				
				// Check that the correct arguments were provided to the NativeObjectConverter's convert() method
				//expect( thisSuite.args[ 0 ] ).toBe( model );  // orig YUI Test err msg: "The first arg provided to NativeObjectConverter::convert() should have been the model."
				//expect( optionsProvidedToConvert.raw ).toBe( true );  // orig YUI Test err msg: "The second arg provided to NativeObjectConverter::convert() should have receieved the 'raw:true' option"
				//expect( optionsProvidedToConvert.attributeNames ).toEqual( [ 'attr1', 'attr2', 'embeddedDataComponent' ] );  // orig YUI Test err msg: "The second arg provided to NativeObjectConverter::convert() should have receieved the 'attributeNames' option, with the attributes that were changed"
			} );
			
		} );
		
		
		describe( 'commit()', function() {
			var TestModel = Class.extend( Model, {
				attributes: [
					{ name: 'attribute1' },
					{ name: 'attribute2', defaultValue: "attribute2's default" },
					{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
					{ name: 'attribute4', set : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } },
					{ name: 'attribute5', set : function( model, newValue ) { return newValue + " " + model.get( 'attribute2' ); } }
				]
			} );
			
			
			it( "committing changed data should cause the model to no longer be considered modified, and cause getChanges() to return an empty object", function() {
				var model = new TestModel();
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				model.commit();
				
				var changes = model.getChanges();
				expect( _.keys( changes ).length ).toBe( 0 );  // orig YUI Test err msg: "The changes hash retrieved should have exactly 0 properties"
				
				expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "The model should no longer be considered modified"
			} );
			
			
			it( "committing changed data should cause rollback() to have no effect", function() {
				var model = new TestModel();
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				model.commit();
				
				// Attempt a rollback, even though the data was committed. Should have no effect.
				model.rollback();
				expect( model.get( 'attribute1' ) ).toBe( "new value 1" );  // orig YUI Test err msg: "attribute1 should have been 'new value 1'. should not have had any effect."
				expect( model.get( 'attribute2' ) ).toBe( "new value 2" );  // orig YUI Test err msg: "attribute2 should have been 'new value 2'. should not have had any effect."
			} );
			
			
			it( "committing changed data should fire the 'commit' event", function() {
				var commitEventCount = 0;
				var model = new TestModel();
				model.addListener( 'commit', function() {
					commitEventCount++;
				} );
				
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				model.commit();
				
				expect( commitEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'commit' event should have been fired exactly once after committing."
			} );
			
			
			it( "committing a parent model should also commit any embedded child DataComponent that the model holds", function() {
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
				
				var mockDataComponent = JsMockito.mock( ConcreteDataComponent );
				var model = new MyModel();
				
				model.set( 'childDataComponent', mockDataComponent );
				model.commit();
				
				JsMockito.verify( mockDataComponent ).commit();  // verify that this was called at least once
			} );
			
		} );
		
		
		
		describe( 'rollback()', function() {
			var TestModel = Class.extend( Model, {
				attributes: [
					{ name: 'attribute1' },
					{ name: 'attribute2', defaultValue: "attribute2's default" },
					{ name: 'attribute3', defaultValue: function() { return "attribute3's default"; } },
					{ name: 'attribute4', set : function( model, newValue ) { return model.get( 'attribute1' ) + " " + model.get( 'attribute2' ); } },
					{ name: 'attribute5', set : function( model, newValue ) { return newValue + " " + model.get( 'attribute2' ); } }
				]
			} );
			
			
			it( "should revert the model's values back to default values if before any committed set() calls", function() {
				// No initial data. 
				// attribute1 should be undefined
				// attribute2 should have the string "attribute2's default"
				var model = new TestModel();
				
				// Set, and then rollback
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				expect( model.isModified() ).toBe( true );  // orig YUI Test err msg: "The model should be considered modified."
				model.rollback();
				
				// Check that they have the original values
				expect( _.isUndefined( model.get( 'attribute1' ) ) ).toBe( true );
				expect( model.get( 'attribute2' ) ).toBe( "attribute2's default" );
				
				// Check that isModified() returns false
				expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "The model should no longer be considered modified after rollback."
			} );
			
			
			it( "should revert the model's values back to their pre-set() values", function() {
				var model = new TestModel( {
					attribute1 : "original attribute1",
					attribute2 : "original attribute2"
				} );
				
				// Set, check if the model is considered modified, and then rollback
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				expect( model.isModified() ).toBe( true );  // orig YUI Test err msg: "The model should be considered modified."
				model.rollback();
				
				// Check that they have the original values
				expect( model.get( 'attribute1' ) ).toBe( "original attribute1" );
				expect( model.get( 'attribute2' ) ).toBe( "original attribute2" );
				
				// Check that isModified() returns false
				expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "The model should no longer be considered modified after rollback."
			} );
			
			
			it( "should revert the model's values back to their pre-set() values, when more than one set() call is made", function() {
				var model = new TestModel( {
					attribute1 : "original attribute1",
					attribute2 : "original attribute2"
				} );
				
				// Set twice, and then rollback
				model.set( 'attribute1', "new value 1" );
				model.set( 'attribute2', "new value 2" );
				model.set( 'attribute1', "new value 1 - even newer" );
				model.set( 'attribute2', "new value 2 - even newer" );
				expect( model.isModified() ).toBe( true );  // orig YUI Test err msg: "The model should be considered modified."
				model.rollback();
				
				// Check that they have the original values after rollback (that the 2nd set of set() calls didn't overwrite the original values) 
				expect( model.get( 'attribute1' ) ).toBe( "original attribute1" );
				expect( model.get( 'attribute2' ) ).toBe( "original attribute2" );
				
				// Check that isModified() returns false
				expect( model.isModified() ).toBe( false );  // orig YUI Test err msg: "The model should no longer be considered modified after rollback."
			} );
			
			
			it( "should fire the 'rollback' event", function() {
				var rollbackEventCount = 0;
				
				var model = new TestModel( {
					attribute1 : 'orig1',
					attribute2 : 'orig2'
				} );
				model.on( 'rollback', function() {
					rollbackEventCount++;
				} );
				
				
				model.set( 'attribute1', 'new1' );
				
				expect( rollbackEventCount ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: The rollback event should not have been fired yet"
				model.rollback();
				expect( rollbackEventCount ).toBe( 1 );  // orig YUI Test err msg: "The rollback event should have been fired exactly once"
			} );
			
		} );
		
		
		describe( 'load()', function() {
			var spiedProxy,
			    readRequest,
			    spiedProxyDeferred,
			    manualProxy,
			    SpiedProxyModel,
			    ManualProxyModel;
			
			
			beforeEach( function() {
				spiedProxy = new ConcreteProxy();
				manualProxy = new ManualResolveProxy();
				
				// Reset between each test
				readRequest = undefined;
				spiedProxyDeferred = undefined;
				
				spyOn( spiedProxy, 'read' ).andCallFake( function( request ) {
					readRequest = request;
					spiedProxyDeferred = new jQuery.Deferred();
					
					return spiedProxyDeferred.promise();
				} );
				
				SpiedProxyModel = Model.extend( {
					attributes : [ 'id', 'name' ],
					proxy : spiedProxy
				} );
				
				ManualProxyModel = Model.extend( {
					attributes : [ 'id', 'a', 'b' ],
					proxy : manualProxy
				} );
			} );
			
			
			it( "should throw an error if there is no configured proxy", function() {
				var NoProxyModel = Model.extend( {
					attributes : [ 'id', 'name' ]
					// note: no configured proxy
				} );
				
				var model = new NoProxyModel();
				expect( function() {
					model.load();
				} ).toThrow( "data.Model::load() error: Cannot load. No proxy configured." );
			} );
			
			
			it( "should delegate to its proxy's read() method, with the model's ID, to retrieve the data", function() {
				var model = new SpiedProxyModel( { id: 1 } );
				model.load();
				
				expect( spiedProxy.read ).toHaveBeenCalled();
				expect( readRequest.getModelId() ).toBe( 1 );
			} );
			
			
			it( "should delegate to its proxy's read() method, even without the model's ID if it doesn't have one assigned, to retrieve the data", function() {
				var model = new SpiedProxyModel();  // note: no `id` assigned
				model.load();
				
				expect( spiedProxy.read ).toHaveBeenCalled();
				expect( readRequest.getModelId() ).toBe( undefined );
			} );
			
			
			it( "should delegate to its proxy's read() method, even if it *doesn't have an idAttribute*, to retrieve the data", function() {
				var NoIdModel = Model.extend( {
					attributes  : [ 'name' ],  // note: no 'id' attribute
					idAttribute : 'id',        // the default value, but just to be explicit
					
					proxy : spiedProxy
				} );
				
				var model = new NoIdModel();
				model.load();
				
				expect( spiedProxy.read ).toHaveBeenCalled();
				expect( readRequest.getModelId() ).toBe( undefined );
			} );
			
			
			it( "should pass any `params` option provided to the method to proxy's read() method, in the Request object", function() {
				var model = new SpiedProxyModel( { id: 1 } ), 
				    params = { a: 1 };
				
				model.load( {
					params : params
				} );
				expect( readRequest.params ).toBe( params );
			} );

			
			it( "should throw an error when the load completes if there are properties in the response object that don't match model attributes, when the `ignoreUnknownAttrsOnLoad` config is false", function() {
				var MyModel = Model.extend( {
					attributes : [ 'a', 'b' ],
					
					proxy : new MemoryProxy( {
						data: { a: 1, b: 2, c: 3 }
					} ),
					ignoreUnknownAttrsOnLoad: false
				} );
				
				var model = new MyModel();
				expect( function() {
					model.load();
				} ).toThrow( "data.Model.set(): An attribute with the attributeName 'c' was not found." );
			} );
			
			
			it( "should *not* throw an error when the load completes if there are properties in the response object that don't match model attributes, when the `ignoreUnknownAttrsOnLoad` config is true", function() {
				var MyModel = Model.extend( {
					attributes : [ 'a', 'b' ],
					
					proxy : new MemoryProxy( {
						data: { a: 1, b: 2, c: 3 }
					} ),
					ignoreUnknownAttrsOnLoad: true
				} );
				
				var model = new MyModel();
				model.load();  // this line should not error

				expect( model.get( 'a' ) ).toBe( 1 );
				expect( model.get( 'b' ) ).toBe( 2 );
			} );
			
			
			it( "when successful, should call its success/complete callbacks, fire the appropriate events, and resolve its deferred with the arguments: [model, operation]", function() {
				var model = new ManualProxyModel( { id: 1 } ),
				    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
				
				modelPersistenceVerifier.execute( 'load' );
				
				manualProxy.resolveRead( 0, {} );  // Resolve the "read" request that the load operation performed (the first 'read' request), and 
				modelPersistenceVerifier.verify( 'success' );  // verify that the appropriate events/callbacks/handlers were called
			} );
			
			
			it( "when an error occurs, should call its error/complete callbacks, fire the appropriate events, and reject its deferred with the arguments: [model, operation]", function() {
				var model = new ManualProxyModel( { id: 1 } ),
				    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
				
				modelPersistenceVerifier.execute( 'load' );
				
				manualProxy.rejectRead( 0 );  // Reject the "read" request that the load operation performed (the first 'read' request), and 
				modelPersistenceVerifier.verify( 'error' );  // verify that the appropriate events/callbacks/handlers were called
			} );
			
			
			it( "when the operation is aborted (canceled), should call its cancel/complete callbacks, fire the appropriate events, and cancel its deferred with the arguments: [model, operation]. " +
			    "It should also not allow the model to be populated even if the request completes afterwards", function() {
				var model = new ManualProxyModel( { id: 1, a: 1, b: 2 } ),
				    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
				
				var operationPromise = modelPersistenceVerifier.execute( 'load' );
				
				// Abort (cancel) the LoadOperation (from the OperationPromise)
				operationPromise.abort();
				
				// Test that if the request completes after the LoadOperation has been aborted, that it has no effect
				manualProxy.resolveRead( 0, { a: 98, b: 99 } );  // Resolve the "read" request that the load operation performed (the first 'read' request)
				expect( model.getData() ).toEqual( { id: 1, a: 1, b: 2 } );
				
				modelPersistenceVerifier.verify( 'cancel' );  // verify that the appropriate events/callbacks/handlers were called
			} );
			
			
			it( "when the operation is aborted (canceled), should call its cancel/complete callbacks, fire the appropriate events, and cancel its deferred with the arguments: [model, operation]. " +
			    "It should also not call 'error' callbacks/events if the request fails afterwards", function() {
				var model = new ManualProxyModel( { id: 1, a: 1, b: 2 } ),
				    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
				
				var operationPromise = modelPersistenceVerifier.execute( 'load' );
				
				// Abort (cancel) the LoadOperation (from the OperationPromise)
				operationPromise.abort();
				
				// Test that if the request fails after the LoadOperation has been aborted, that this has no effect
				manualProxy.rejectRead( 0 );  // Reject the "read" request that the load operation performed (the first 'read' request), and
				
				modelPersistenceVerifier.verify( 'cancel' );  // verify that the appropriate events/callbacks/handlers were called
			} );
			
		} );
		
		
		
		describe( 'save()', function() {
			var spiedProxy,
			    saveRequest,
			    proxyDeferred,
			    manualProxy,
			    SpiedProxyModel,
			    ManualProxyModel;
			
			
			beforeEach( function() {
				spiedProxy = new ConcreteProxy();
				manualProxy = new ManualResolveProxy();
				
				// Reset between each test
				saveRequest = undefined;
				proxyDeferred = undefined;
				
				spyOn( spiedProxy, 'create' ).andCallFake( function( request ) {
					saveRequest = request;
					proxyDeferred = new jQuery.Deferred();
					
					return proxyDeferred.promise();
				} );
				spyOn( spiedProxy, 'update' ).andCallFake( function( request ) {
					saveRequest = request;
					proxyDeferred = new jQuery.Deferred();
					
					return proxyDeferred.promise();
				} );
				
				SpiedProxyModel = Model.extend( {
					attributes : [ 'id', 'name' ],
					proxy : spiedProxy
				} );
				
				ManualProxyModel = Model.extend( {
					attributes : [ 'id', 'a', 'b' ],
					proxy : manualProxy
				} );
			} );
			
			
				
			it( "should throw an error if there is no configured proxy", function() {
				var NoProxyModel = Model.extend( {
					// note: no proxy
				} );
				
				var model = new NoProxyModel();
				expect( function() {
					model.save();
				} ).toThrow( "data.Model::save() error: Cannot save. No proxy." );
			} );
			
			
			it( "should delegate to its proxy's create() method to persist changes when the Model does not have an id set", function() {
				var model = new SpiedProxyModel();  // note: no 'id' set
				model.save();
				
				expect( spiedProxy.create ).toHaveBeenCalled();
				expect( spiedProxy.update ).not.toHaveBeenCalled();
			} );
			
			
			it( "should delegate to its proxy's update() method to persist changes, when the Model has an id", function() {
				var model = new SpiedProxyModel( { id: 1 } );
				model.save();
				
				expect( spiedProxy.create ).not.toHaveBeenCalled();
				expect( spiedProxy.update ).toHaveBeenCalled();
			} );
			
			
			it( "should pass any `params` option provided to the method to proxy's create() or update() method, in the Request object", function() {
				var model = new SpiedProxyModel(), 
				    createParams = { a: 1 },
				    updateParams = { b: 2 };
				
				model.save( {
					params : createParams
				} );
				expect( saveRequest.params ).toBe( createParams );
				
				model.set( 'id', 1 );  // now give the model an ID
				model.save( {
					params : updateParams
				} );
				expect( saveRequest.params ).toBe( updateParams );
			} );
			
			
			it( "should commit the model after a successful save, so that it is no longer in a 'modified' state", function() {
				var model = new ManualProxyModel();
				
				model.set( { a: 1, b: 2 } );
				expect( model.isModified() ).toBe( true );  // initial condition
				
				model.save();  // begin save
				expect( model.isModified() ).toBe( true );  // still modified, since the save hasn't completed yet
				
				manualProxy.resolveCreate( 0 );  // complete save ('create') successfully
				expect( model.isModified() ).toBe( false );  // successful save, should no longer be modified
			} );
			
			
			it( "should *not* commit the model after an errored save, so that it is still in a 'modified' state (since the persistence operation failed)", function() {
				var model = new ManualProxyModel();
				
				model.set( { a: 1, b: 2 } );
				expect( model.isModified() ).toBe( true );  // initial condition
				
				model.save();  // begin save
				expect( model.isModified() ).toBe( true );  // still modified, since the save hasn't completed yet
				
				manualProxy.rejectCreate( 0 );  // complete save ('create') with error
				expect( model.isModified() ).toBe( true );  // still modified, since the save ('create') request errored
			} );
			
			
			describe( "callbacks, events, and deferred resolution/rejection", function() {
			
				it( "when creating, and successful, should call its success/complete callbacks, fire the appropriate events, and resolve its deferred with the arguments: [model, operation]", function() {
					var model = new ManualProxyModel(),
					    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
					
					expect( model.isSaving() ).toBe( false );  // initial condition
					modelPersistenceVerifier.execute( 'save' );
					
					manualProxy.resolveCreate( 0 );  // Resolve the "create" request that the save operation performed (the first 'create' request), and 
					modelPersistenceVerifier.verify( 'success' );  // verify that the appropriate events/callbacks/handlers were called
				} );
				
				
				it( "when creating, but an error occurs, should call its error/complete callbacks, fire the appropriate events, and reject its deferred with the arguments: [model, operation]", function() {
					var model = new ManualProxyModel(),
					    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
					
					expect( model.isSaving() ).toBe( false );  // initial condition
					modelPersistenceVerifier.execute( 'save' );
					
					manualProxy.rejectCreate( 0 );  // Reject the "create" request that the save operation performed (the first 'create' request), and 
					modelPersistenceVerifier.verify( 'error' );  // verify that the appropriate events/callbacks/handlers were called
				} );
				
				
				it( "when updating, and successful, should call its success/complete callbacks, fire the appropriate events, and resolve its deferred with the arguments: [model, operation]", function() {
					var model = new ManualProxyModel( { id: 1 } ),  // will 'update' since it has an ID
					    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
					
					expect( model.isSaving() ).toBe( false );  // initial condition
					modelPersistenceVerifier.execute( 'save' );
					
					manualProxy.resolveUpdate( 0 );  // Resolve the "update" request that the save operation performed (the first 'update' request), and 
					modelPersistenceVerifier.verify( 'success' );  // verify that the appropriate events/callbacks/handlers were called
				} );
				
				
				it( "when updating, but an error occurs, should call its error/complete callbacks, fire the appropriate events, and reject its deferred with the arguments: [model, operation]", function() {
					var model = new ManualProxyModel( { id: 1 } ),  // will 'update' since it has an ID
					    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
					
					expect( model.isSaving() ).toBe( false );  // initial condition
					modelPersistenceVerifier.execute( 'save' );
					
					manualProxy.rejectUpdate( 0 );  // Reject the "update" request that the save operation performed (the first 'update' request), and 
					modelPersistenceVerifier.verify( 'error' );  // verify that the appropriate events/callbacks/handlers were called
				} );
				
				
				it( "when the operation is aborted (canceled), should call its cancel/complete callbacks, fire the appropriate events, and cancel its deferred with the arguments: [model, operation]. " +
				    "It should also not allow the model to be populated even if the request completes afterwards", function() {
					var model = new ManualProxyModel( { id: 1, a: 1, b: 2 } ),
					    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
					
					var operationPromise = modelPersistenceVerifier.execute( 'save' );
					
					// Abort (cancel) the LoadOperation (from the OperationPromise)
					operationPromise.abort();
					
					// Test that if the request completes after the LoadOperation has been aborted, that it has no effect.
					manualProxy.resolveUpdate( 0, { a: 98, b: 99 } );            // Resolve the "update" request that the save operation performed (the first 'update' request)
					expect( model.getData() ).toEqual( { id: 1, a: 1, b: 2 } );  // Data should be the original data, since the operation was aborted (canceled).
					
					modelPersistenceVerifier.verify( 'cancel' );  // verify that the appropriate events/callbacks/handlers were called
				} );
				
				
				it( "when the operation is aborted (canceled), should call its cancel/complete callbacks, fire the appropriate events, and cancel its deferred with the arguments: [model, operation]. " +
				    "It should also not call 'error' callbacks/events if the request fails afterwards", function() {
					var model = new ManualProxyModel( { id: 1, a: 1, b: 2 } ),
					    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
					
					var operationPromise = modelPersistenceVerifier.execute( 'save' );
					
					// Abort (cancel) the LoadOperation (from the OperationPromise)
					operationPromise.abort();
					
					// Test that if the request fails after the LoadOperation has been aborted, that this has no effect
					manualProxy.rejectUpdate( 0 );  // Reject the "update" request that the save operation performed (the first 'update' request), and
					
					modelPersistenceVerifier.verify( 'cancel' );  // verify that the appropriate events/callbacks/handlers were called
				} );
				
			} );
			
			
			describe( "handling server (proxy) update data", function() {
				
				it( "should apply any attributes returned by the server (proxy) to the model upon successful save", function() {
					var model = new ManualProxyModel( { a: 1, b: 2 } );
					
					model.save();  // begin save
					manualProxy.resolveCreate( 0, { id: 42, b: 99 } );  // complete save, with return data
					
					// Check that proxy return properties were applied
					expect( model.get( 'id' ) ).toBe( 42 );
					expect( model.get( 'a' ) ).toBe( 1 );  // unmodified by proxy result
					expect( model.get( 'b' ) ).toBe( 99 );
				} );
				
				
				it( "should not change any attributes if the server (proxy) does not return any data", function() {
					var model = new ManualProxyModel( { a: 1, b: 2 } );
					
					model.save();  // begin save
					manualProxy.resolveCreate( 0 );  // complete save, with no return data
					
					// Check that model attributes were not changed
					expect( model.get( 'id' ) ).toBe( undefined );
					expect( model.get( 'a' ) ).toBe( 1 );
					expect( model.get( 'b' ) ).toBe( 2 );
				} );
				
			} );
			
			
			// -------------------------------
			
			
			// Note: temporarily removed this functionality to implement the server (proxy) return data when saving
			xdescribe( "Test concurrent persistence and model updates", function() {
				var manualProxy,
				    ManualProxyModel;
				
				beforeEach( function() {
					manualProxy = new ManualResolveProxy();
					
					ManualProxyModel = Model.extend( {
						attributes : [ 'id', 'attribute1', 'attribute2' ],
						proxy : manualProxy
					} );
				} );
				
				
				it( "Model attributes that are updated (via set()) while a persistence request is in progress should not be marked as committed when the persistence request completes", function() {
					var model = new ManualProxyModel( { id: 1 } );
					
					// Initial set
					model.set( 'attribute1', "origValue1" );
					model.set( 'attribute2', "origValue2" );
					
					
					
					// Begin persistence request, defining a callback for when it is complete (just to confirm that it has been successfully completed)
					var doneCallCount = 0;
					model.save().done( function() {
						doneCallCount++;
					} );
					
					// Now set the attribute while the async persistence (save) request is "in progress"
					model.set( 'attribute1', "newValue1" );
					// note: not setting attribute2 here
					
					expect( doneCallCount ).toBe( 0 );  // not done saving yet
					
					// "resolve" the save (update) request to continue the test and check its post-completion state
					manualProxy.resolveUpdate( 0 );
					expect( doneCallCount ).toBe( 1 );  // confirm success of save()
					
					expect( model.isModified() ).toBe( true );  // model should still be considered modified after the persistence request completes. attribute1 was set after the persistence request began.
					expect( model.isModified( 'attribute1' ) ).toBe( true );  // attribute1 should be marked as modified. It was updated (set) after the persistence request began.
					expect( model.isModified( 'attribute2' ) ).toBe( false );  // attribute2 should not be marked as modified. It was not updated after the persistence request began.
					
					expect( model.get( 'attribute1' ) ).toBe( "newValue1" );   // a get() request on attribute1 should return the new value.
					expect( model.get( 'attribute2' ) ).toBe( "origValue2" );  // a get() request on attribute2 should return the persisted value. It was not updated since the persistence request began.			
				} );
				
				
				it( "Model attributes that are updated *more than once* (via set()) while a persistence request is in progress should not be marked as committed when the persistence request completes", function() {
					var model = new ManualProxyModel( { id: 1 } );
					
					// Initial set
					model.set( 'attribute1', "origValue1" );
					model.set( 'attribute2', "origValue2" );
					
					// Begin persistence request, defining a callback for when it is complete (just to confirm that it has been successfully completed)
					var doneCallCount = 0;
					model.save().done( function() {
						doneCallCount++;
					} );
					
					
					// Now set the attribute twice while the async persistence request is "in progress"
					model.set( 'attribute1', "newValue1" );
					model.set( 'attribute1', "newValue11" );  // set it again
					// note: not setting attribute2 here
					
					expect( doneCallCount ).toBe( 0 );  // confirm not done saving yet
					
					
					// "resolve" the save (update) request to continue the test and check its post-completion state
					manualProxy.resolveUpdate( 0 );
					expect( doneCallCount ).toBe( 1 );  // confirm success of save()
					
					expect( model.isModified() ).toBe( true );  // The model should still be considered modified after the persistence request. `attribute1` was set after the persistence request began.
							
					expect( model.isModified( 'attribute1' ) ).toBe( true );  // attribute1 should be marked as modified. It was updated (set) after the persistence request began.
					expect( model.isModified( 'attribute2' ) ).toBe( false );  // attribute2 should not be marked as modified. It was not updated after the persistence request began.
					
					expect( model.get( 'attribute1' ) ).toBe( "newValue11" );  // a get() request on attribute1 should return the new value.
					expect( model.get( 'attribute2' ) ).toBe( "origValue2" );  // a get() request on attribute2 should return the persisted value. It was not updated since the persistence request began.
					
					// Now rollback the model, and see if the original value of attribute1 is still there
					model.rollback();
					expect( model.get( 'attribute1' ) ).toBe( "origValue1" );  // The value for attribute1 should have been rolled back to its original value
				} );
				
			} );
			
			
			describe( "Test save() with related Models and Collections that need to be sync'd first", function() {
				var parentModelProxy,
				    ParentModel,
				    ChildModel,
				    collections,
				    models,
				    deferreds;
				
				beforeEach( function() {
					collections = {};
					models = {},
					deferreds = {};
					
					parentModelProxy = new ConcreteProxy();
					spyOn( parentModelProxy, 'create' ).andCallFake( function() {
						var deferred = deferreds[ 'parentModelProxy' ] = new jQuery.Deferred();
						return deferred;
					} );
					
					ChildModel = Model.extend( {
						attributes : [ 'id', 'attr' ],
						proxy : new ConcreteProxy()  // not actually needed for the tests due to "faked" save() method, but makes it clear
					} );
					
					ParentModel = Model.extend( {
						attributes : [
							{ name: 'id', type: 'int' },
							{ name: 'attr', type: 'string' },
							{ name: 'c1', type: 'collection' },
							{ name: 'c2', type: 'collection' },
							{ name: 'm1', type: 'model', model: ChildModel },
							{ name: 'm2', type: 'model', model: ChildModel }
						],
						
						proxy : parentModelProxy
					} );
				} );
				
				
				// Helper methods
				
				function createCollection( collectionName ) {
					var collection = collections[ collectionName ] = new Collection();
					
					spyOn( collection, 'getModels' ).andCallFake( function() { return []; } );
					spyOn( collection, 'sync' ).andCallFake( function() {
						var deferred = deferreds[ collectionName + 'Sync' ] = new jQuery.Deferred();
						return deferred.promise();
					} );
					
					return collection;
				}
				
				function createModel( modelName ) {
					var model = models[ modelName ] = new ChildModel();
					
					spyOn( model, 'save' ).andCallFake( function() {
						var deferred = deferreds[ modelName + 'Save' ] = new jQuery.Deferred();
						return deferred.promise();
					} );
					
					return model;
				}
				
				
				it( "should synchronize any nested 'related' (as opposed to 'embedded') models and collections before synchronizing itself", function() {
					var collection1 = createCollection( 'collection1' ),
					    model1 = createModel( 'model1' );
					
					var parentModel = new ParentModel( {
						attr : "attrValue",
						c1   : collection1,
						m1   : model1
					} );
					
					var doneCount = 0,      // 3 vars for returned Promise object
					    failCount = 0,
					    alwaysCount = 0;
					    
					var savePromise = parentModel.save()
						.done( function() { doneCount++; } )
						.fail( function() { failCount++; } )
						.always( function() { alwaysCount++; } );
					
					// Initial state after parent model save() call
					expect( collection1.sync.calls.length ).toBe( 1 );
					expect( model1.save.calls.length ).toBe( 1 );
					expect( parentModelProxy.create ).not.toHaveBeenCalled();  // shouldn't have called the parent model's proxy yet - waiting until children have sync'd
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 0 );
					
					
					// State after all related data components (models and collections) have completed saving/sync'ing.
					// Still waiting for the parent model itself to save.
					deferreds[ 'collection1Sync' ].resolve();
					deferreds[ 'model1Save' ].resolve();
					
					expect( collection1.sync.calls.length ).toBe( 1 );
					expect( model1.save.calls.length ).toBe( 1 );
					expect( parentModelProxy.create.calls.length ).toBe( 1 );  // parent model proxy should now have been called, since the children have sync'd
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 0 );
					
					
					// State after parent model has saved
					var request = new CreateRequest();
					request.setResultSet( new ResultSet() );
					deferreds[ 'parentModelProxy' ].resolve( request );
					
					expect( doneCount ).toBe( 1 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 1 );
				} );
				
				
				it( "should *not* synchronize any nested 'related' (as opposed to 'embedded') models and collections if the `syncRelated` option is passed as `false`", function() {
					var collection1 = createCollection( 'collection1' ),
					    model1 = createModel( 'model1' );
					
					var parentModel = new ParentModel( {
						attr : "attrValue",
						c1   : collection1,
						m1   : model1
					} );
					
					var doneCount = 0,      // 3 vars for returned Promise object
					    failCount = 0,
					    alwaysCount = 0;
					    
					var savePromise = parentModel.save( { syncRelated: false } )  // don't sync related models/collections
						.done( function() { doneCount++; } )
						.fail( function() { failCount++; } )
						.always( function() { alwaysCount++; } );
					
					// Initial state after parent model save() call
					expect( collection1.sync ).not.toHaveBeenCalled();
					expect( model1.save ).not.toHaveBeenCalled();
					expect( parentModelProxy.create.calls.length ).toBe( 1 );  // parent model proxy should have been immediately called, since the children don't need to be sync'd
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 0 );
					
					// State after parent model has saved
					var request = new CreateRequest();
					request.setResultSet( new ResultSet() );
					deferreds[ 'parentModelProxy' ].resolve( request );
					
					expect( collection1.sync ).not.toHaveBeenCalled();  // make sure it still havent' been called
					expect( model1.save ).not.toHaveBeenCalled();       // make sure it still havent' been called
					expect( doneCount ).toBe( 1 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 1 );
				} );
				
				
				it( "should call the 'error' and 'fail' callbacks if a nested related collection fails to synchronize", function() {
					var collection1 = createCollection( 'collection1' ),  // this one will succeed
					    collection2 = createCollection( 'collection2' ),  // this one will error
					    model1 = createModel( 'model1' );
					
					var parentModel = new ParentModel( {
						attr : "attrValue",
						c1   : collection1,
						c2   : collection2,
						m1   : model1
					} );
					
					var doneCount = 0,      // 3 vars for returned Promise object
					    failCount = 0,
					    alwaysCount = 0;
					    
					var savePromise = parentModel.save()
						.done( function() { doneCount++; } )
						.fail( function() { failCount++; } )
						.always( function() { alwaysCount++; } );
					
					// Initial state after parent model save() call
					expect( collection1.sync.calls.length ).toBe( 1 );
					expect( model1.save.calls.length ).toBe( 1 );
					expect( parentModelProxy.create ).not.toHaveBeenCalled();  // shouldn't have called the parent model's proxy yet - waiting until children have sync'd
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 0 );
					
					
					// State after a related collection has failed to save
					deferreds[ 'collection1Sync' ].resolve();
					deferreds[ 'collection2Sync' ].reject();  // this one fails
					deferreds[ 'model1Save' ].resolve();
					
					expect( parentModelProxy.create ).not.toHaveBeenCalled();  // still shouldn't have called the parent model's proxy, since the children failed to sync
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 1 );
					expect( alwaysCount ).toBe( 1 );
				} );
				
				
				it( "should call the 'error' and 'fail' callbacks if a nested related model fails to synchronize", function() {
					var collection1 = createCollection( 'collection1' ),
					    model1 = createModel( 'model1' ),  // this one will succeed
					    model2 = createModel( 'model2' );  // this one will fail
					
					var parentModel = new ParentModel( {
						attr : "attrValue",
						c1   : collection1,
						m1   : model1,
						m2   : model2
					} );
					
					var doneCount = 0,      // 3 vars for returned Promise object
					    failCount = 0,
					    alwaysCount = 0;
					    
					var savePromise = parentModel.save()
						.done( function() { doneCount++; } )
						.fail( function() { failCount++; } )
						.always( function() { alwaysCount++; } );
					
					// Initial state after parent model save() call
					expect( collection1.sync.calls.length ).toBe( 1 );
					expect( model1.save.calls.length ).toBe( 1 );
					expect( parentModelProxy.create ).not.toHaveBeenCalled();  // shouldn't have called the parent model's proxy yet - waiting until children have sync'd
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 0 );
					
					
					// State after the related model has failed to save
					deferreds[ 'collection1Sync' ].resolve();
					deferreds[ 'model1Save' ].resolve();
					deferreds[ 'model2Save' ].reject();  // this one fails
					
					expect( parentModelProxy.create ).not.toHaveBeenCalled();  // still shouldn't have called the parent model's proxy, since the children failed to sync
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 1 );
					expect( alwaysCount ).toBe( 1 );
				} );
				
				
				it( "should call the 'error' and 'fail' callbacks if nested related models/collections synchronize, but the parent model itself fails to save", function() {
					var collection1 = createCollection( 'collection1' ),
					    model1 = createModel( 'model1' );
					
					var parentModel = new ParentModel( {
						attr : "attrValue",
						c1   : collection1,
						m1   : model1
					} );
					
					var doneCount = 0,      // 3 vars for returned Promise object
					    failCount = 0,
					    alwaysCount = 0;
					    
					var savePromise = parentModel.save()
						.done( function() { doneCount++; } )
						.fail( function() { failCount++; } )
						.always( function() { alwaysCount++; } );
					
					// Initial state after parent model save() call
					expect( collection1.sync.calls.length ).toBe( 1 );
					expect( model1.save.calls.length ).toBe( 1 );
					expect( parentModelProxy.create ).not.toHaveBeenCalled();  // shouldn't have called the parent model's proxy yet - waiting until children have sync'd
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 0 );
					
					
					// State after all related data components (models and collections) have completed saving/sync'ing.
					// Still waiting for the parent model itself to save.
					deferreds[ 'collection1Sync' ].resolve();
					deferreds[ 'model1Save' ].resolve();
					
					expect( parentModelProxy.create.calls.length ).toBe( 1 );  // should have called the parent model's proxy now, since the children have been sync'd
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 0 );
					expect( alwaysCount ).toBe( 0 );
					
					
					// State after parent model itself has failed to save
					var request = new CreateRequest();
					deferreds[ 'parentModelProxy' ].reject( request );
					
					expect( doneCount ).toBe( 0 );
					expect( failCount ).toBe( 1 );
					expect( alwaysCount ).toBe( 1 );
				} );
				
			} );
			
		} );
		
		
		describe( 'destroy()', function() {
			var spiedProxy,
			    destroyRequest,
			    spiedProxyDeferred,
			    manualProxy,
			    SpiedProxyModel,
			    ManualProxyModel;
			
			beforeEach( function() {
				spiedProxy = new ConcreteProxy();
				manualProxy = new ManualResolveProxy();
				
				// Reset between each test
				destroyRequest = undefined;
				spiedProxyDeferred = undefined;
				
				spyOn( spiedProxy, 'destroy' ).andCallFake( function( request ) {
					destroyRequest = request;
					spiedProxyDeferred = new jQuery.Deferred();
					
					return spiedProxyDeferred.promise();
				} );
				
				SpiedProxyModel = Model.extend( {
					attributes : [ 'id', 'name' ],
					proxy : spiedProxy
				} );
				
				ManualProxyModel = Model.extend( {
					attributes : [ 'id', 'a', 'b' ],
					proxy : manualProxy
				} );
			} );
			
			
			it( "should throw an error if there is no configured proxy", function() {
				var NoProxyModel = Model.extend( {
					attributes : [ 'id', 'attribute1', 'attribute2' ]
					// note: no proxy
				} );
				
				var model = new NoProxyModel( { id: 1 } );
				expect( function() {
					model.destroy();
				} ).toThrow( "data.Model::destroy() error: Cannot destroy model on server. No proxy." );
			} );
			
			
			it( "should delegate to its proxy's destroy() method to persist the destruction of the model", function() {
				var model = new SpiedProxyModel( { id: 1 } );  // the model needs an id to be considered as persisted on the server
				model.destroy();
				
				expect( spiedProxy.destroy ).toHaveBeenCalled();
			} );
			
			
			it( "should pass any `params` option provided to the method to proxy's destroy() method, in the Request object", function() {
				// Instantiate and run the destroy() method to delegate
				var model = new SpiedProxyModel( { id: 1 } ),  // the model needs an id to be considered persisted on the server
				    params = { a: 1 };
				
				model.destroy( {
					params : params
				} );
				
				expect( destroyRequest.params ).toBe( params );
			} );
			
			
			it( "should call its success/complete callbacks, fire the appropriate events, and resolve its deferred with the arguments [model, operation] when successful", function() {
				var model = new ManualProxyModel( { id: 1 } ),
				    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
				
				modelPersistenceVerifier.execute( 'destroy' );
				
				manualProxy.resolveDestroy( 0 );  // Resolve the "destroy" request that the destroy operation performed (the first 'destroy' request), and 
				modelPersistenceVerifier.verify( 'success' );  // verify that the appropriate events/callbacks/handlers were called
				
				expect( model.isDestroyed() ).toBe( true );
			} );
			
			
			it( "should call its error/complete callbacks, fire the appropriate events, and reject its deferred with the arguments [model, operation] if an error occurs", function() {
				var model = new ManualProxyModel( { id: 1 } ),
				    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
				
				modelPersistenceVerifier.execute( 'destroy' );
				
				manualProxy.rejectDestroy( 0 );  // Reject the "destroy" request that the destroy operation performed (the first 'destroy' request), and 
				modelPersistenceVerifier.verify( 'error' );  // verify that the appropriate events/callbacks/handlers were called
				
				expect( model.isDestroyed() ).toBe( false );   // failed to destroy
			} );
			
			
			it( "when the operation is aborted (canceled), should call its cancel/complete callbacks, fire the appropriate events, and cancel its deferred with the arguments: [model, operation]. " +
			    "It should also not allow the model to be destroyed even if the request completes afterwards", function() {
				var model = new ManualProxyModel( { id: 1, a: 1, b: 2 } ),
				    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
				
				var operationPromise = modelPersistenceVerifier.execute( 'destroy' );
				
				// Abort (cancel) the DestroyOperation (from the OperationPromise)
				operationPromise.abort();
				
				// Test that if the request completes after the LoadOperation has been aborted, that it has no effect
				manualProxy.resolveDestroy( 0 );  // Resolve the "destroy" request that the load operation performed (the first 'read' request)
				expect( model.isDestroyed() ).toBe( false );
				
				modelPersistenceVerifier.verify( 'cancel' );  // verify that the appropriate events/callbacks/handlers were called
			} );
			
			
			it( "when the operation is aborted (canceled), should call its cancel/complete callbacks, fire the appropriate events, and cancel its deferred with the arguments: [model, operation]. " +
			    "It should also not call 'error' callbacks/events if the request fails afterwards", function() {
				var model = new ManualProxyModel( { id: 1, a: 1, b: 2 } ),
				    modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
				
				var operationPromise = modelPersistenceVerifier.execute( 'destroy' );
				
				// Abort (cancel) the DestroyOperation (from the OperationPromise)
				operationPromise.abort();
				
				// Test that if the request fails after the LoadOperation has been aborted, that this has no effect
				manualProxy.rejectDestroy( 0 );  // Reject the "destroy" request that the load operation performed (the first 'read' request), and
				
				modelPersistenceVerifier.verify( 'cancel' );  // verify that the appropriate events/callbacks/handlers were called
			} );
			
		} );
		
		
		
		// ---------------------------------------
		
		// Utility methods
		
		describe( 'getDataComponentAttributes()', function() {
			
			it( "should return an array of the attributes which are to hold data.DataComponent values", function() {
				var TestModel = Model.extend( {
					attributes : [
						{ name: 'stringAttr', type: 'string' },
						{ name: 'modelAttr', type: 'model' },
						{ name: 'collectionAttr', type: 'collection' }
					]
				} );
				
				var model = new TestModel(),
				    dataComponentAttrs = model.getDataComponentAttributes();
				
				expect( dataComponentAttrs.length ).toBe( 2 );
				expect( dataComponentAttrs[ 0 ].getName() ).toBe( 'modelAttr' );
				expect( dataComponentAttrs[ 1 ].getName() ).toBe( 'collectionAttr' );
			} );
			
		} );
		
		
		describe( 'getEmbeddedDataComponentAttributes()', function() {
			
			it( "should return an array of the attributes which are to hold data.DataComponent values, and are 'embedded'", function() {
				var TestModel = Model.extend( {
					attributes : [
						{ name: 'stringAttr', type: 'string' },
						{ name: 'modelAttr', type: 'model' },
						{ name: 'collectionAttr', type: 'collection' },
						{ name: 'embeddedModelAttr', type: 'model', embedded: true },
						{ name: 'embeddedCollectionAttr', type: 'collection', embedded: true }
					]
				} );
				
				var model = new TestModel(),
				    embeddedDataComponentAttrs = model.getEmbeddedDataComponentAttributes();
				
				expect( embeddedDataComponentAttrs.length ).toBe( 2 );
				expect( embeddedDataComponentAttrs[ 0 ].getName() ).toBe( 'embeddedModelAttr' );
				expect( embeddedDataComponentAttrs[ 1 ].getName() ).toBe( 'embeddedCollectionAttr' );
			} );
			
		} );
		
		
		describe( 'getCollectionAttributes()', function() {
			
			it( "should return an array of attributes which are to hold data.Collection values", function() {
				var TestModel = Model.extend( {
					attributes : [
						{ name: 'stringAttr', type: 'string' },
						{ name: 'modelAttr', type: 'model' },
						{ name: 'collectionAttr', type: 'collection' }
					]
				} );
				
				var model = new TestModel(),
				    collectionAttrs = model.getCollectionAttributes();
				
				expect( collectionAttrs.length ).toBe( 1 );
				expect( collectionAttrs[ 0 ].getName() ).toBe( 'collectionAttr' );
			} );
			
		} );
		
		
		describe( 'getRelatedCollectionAttributes()', function() {
			
			it( "should return an array of attributes which are to hold data.Collection values, that are 'related' (i.e. not 'embedded')", function() {
				var TestModel = Model.extend( {
					attributes : [
						{ name: 'stringAttr', type: 'string' },
						{ name: 'modelAttr', type: 'model' },
						{ name: 'relatedCollectionAttr1', type: 'collection' },
						{ name: 'relatedCollectionAttr2', type: 'collection' },
						{ name: 'embeddedCollectionAttr', type: 'collection', embedded: true }
					]
				} );
				
				var model = new TestModel(),
				    relatedCollectionAttrs = model.getRelatedCollectionAttributes();
				
				expect( relatedCollectionAttrs.length ).toBe( 2 );
				expect( relatedCollectionAttrs[ 0 ].getName() ).toBe( 'relatedCollectionAttr1' );
				expect( relatedCollectionAttrs[ 1 ].getName() ).toBe( 'relatedCollectionAttr2' );
			} );
			
		} );
		
		
		describe( 'getModelAttributes()', function() {
			
			it( "should return an array of attributes which are to hold data.Model values", function() {
				var TestModel = Model.extend( {
					attributes : [
						{ name: 'stringAttr', type: 'string' },
						{ name: 'modelAttr', type: 'model' },
						{ name: 'collectionAttr', type: 'collection' }
					]
				} );
				
				var model = new TestModel(),
				    modelAttrs = model.getModelAttributes();
				
				expect( modelAttrs.length ).toBe( 1 );
				expect( modelAttrs[ 0 ].getName() ).toBe( 'modelAttr' );
			} );
			
		} );
		
		
		describe( 'getRelatedModelAttributes()', function() {
			
			it( "should return an array of attributes which are to hold data.Model values, that are 'related' (i.e. not 'embedded')", function() {
				var TestModel = Model.extend( {
					attributes : [
						{ name: 'stringAttr', type: 'string' },
						{ name: 'collectionAttr', type: 'collection' },
						{ name: 'relatedModelAttr1', type: 'model' },
						{ name: 'relatedModelAttr2', type: 'model' },
						{ name: 'embeddedModelAttr', type: 'model', embedded: true }
					]
				} );
				
				var model = new TestModel(),
				    relatedModelAttrs = model.getRelatedModelAttributes();
				
				expect( relatedModelAttrs.length ).toBe( 2 );
				expect( relatedModelAttrs[ 0 ].getName() ).toBe( 'relatedModelAttr1' );
				expect( relatedModelAttrs[ 1 ].getName() ).toBe( 'relatedModelAttr2' );
			} );
			
		} );
		
	} );
} );