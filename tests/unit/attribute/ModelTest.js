/*global define, Ext, Y, JsMockito, tests */
define( [
	'data/attribute/Model',
	'data/Model'
], function( ModelAttribute, Model ) {
		
	tests.unit.attribute.add( new Ext.test.TestSuite( {
		
		name: 'Data.attribute.Model',
		
		
		items : [
			
			/*
			 * Test constructor
			 */
			{
				name : "Test constructor",
				
				// Special instructions
				_should : {
					error : {
						"the constructor should throw an error if the undefined value is provided for the modelClass config, which helps determine when late binding is needed for the modelClass config" : 
							 "The 'modelClass' config provided to an Attribute with the name 'attr' either doesn't exist, or doesn't " +
				             "exist just yet. Consider using the String or Function form of the modelClass config for late binding, if needed"
					}
				},
				
				
				"the constructor should throw an error if the undefined value is provided for the modelClass config, which helps determine when late binding is needed for the modelClass config" : function() {
					var attr = new ModelAttribute( {
						name : 'attr',
						modelClass: undefined
					} );
					
					Y.Assert.fail( "The constructor should have thrown an error if the modelClass config was provided but was undefined. This is to help with debugging when late binding for the modelClass is needed." );
				}
			},
			
			
			/*
			 * Test valuesAreEqual()
			 */
			{
				name : "Test valuesAreEqual()",
				
				setUp : function() {
					this.attribute = new ModelAttribute( { name: 'attr' } );
				},
				
				
				"valuesAreEqual() should return true for two null values" : function() {
					var result = this.attribute.valuesAreEqual( null, null );
					Y.Assert.isTrue( result );
				},
				
				
				"valuesAreEqual() should return false for one null and one object" : function() {
					var result;
					
					result = this.attribute.valuesAreEqual( null, {} );
					Y.Assert.isFalse( result );
					
					result = this.attribute.valuesAreEqual( {}, null );
					Y.Assert.isFalse( result );
				},
				
				
				"valuesAreEqual() should return true for comparing the same model" : function() {
					var MyModel = Model.extend( {
						attributes : [ 'id' ]
					} );
					
					// NOTE: These should refer to the same object, as only one Model will be instantiated for two Models with the same ID 
					var model1 = new MyModel( { id: 1 } ),
					    model2 = new MyModel( { id: 1 } );
					
					var result = this.attribute.valuesAreEqual( model1, model2 );
					Y.Assert.isTrue( result );
				},
				
				
				"valuesAreEqual() should return false for two different models" : function() {
					var MyModel = Model.extend( {
						attributes : [ 'id' ]
					} );
					
					var model1 = new MyModel( { id: 1 } ),
					    model2 = new MyModel( { id: 2 } );
					
					var result = this.attribute.valuesAreEqual( model1, model2 );
					Y.Assert.isFalse( result );
				}
			},
			
			
			/*
			 * Test beforeSet()
			 */
			{
				name : "Test beforeSet()",
				
				
				setUp : function() {
					this.Model = Model.extend( {
						attributes : [ 'attr1', 'attr2' ]
					} );
					
					this.attribute = new ModelAttribute( { 
						name: 'attr',
						modelClass: this.Model
					} );
				},
				
				
				_should : {
					error : {
						"beforeSet() should throw an error if the string 'modelClass' config does not reference a Model class" :
							"The string value 'modelClass' config did not resolve to a Model class for attribute 'attr'",
						"beforeSet() should throw an error if the function value 'modelClass' config does not reference a Model class" :
							"The function value 'modelClass' config did not resolve to a Model class for attribute 'attr'"
					}
				},
				
				
				// -----------------------
				
				
				"beforeSet() should return null when provided any falsy value, or non-object" : function() {
					var mockModel = JsMockito.mock( Model ),
					    attribute = new ModelAttribute( { name: 'attr' } ),
					    oldValue,  // undefined
					    value;
					
					value = attribute.beforeSet( mockModel, 0, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, 1, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, "", oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, "hi", oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, false, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, true, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, undefined, oldValue );
					Y.Assert.areSame( null, value );
					
					value = attribute.beforeSet( mockModel, null, oldValue );
					Y.Assert.areSame( null, value );
				},
				
				
				// ---------------------------
				
				// Test errors for if the string or function 'modelClass' configs still return an undefined value
				
				"beforeSet() should throw an error if the string 'modelClass' config does not reference a Model class" : function() {				
					var mockModel = JsMockito.mock( Model ),
					    oldValue;  // undefined
					
					var attribute = new ModelAttribute( { 
						name: 'attr',
						modelClass: 'somethingThatIsNotDefined'
					} );
					
					var data = { attr1: 1, attr2: 2 },
					    value = attribute.beforeSet( mockModel, data, oldValue );
					
					Y.Assert.fail( "The test should have thrown an error in the call to attribute.beforeSet()" );
				},
				
				
				"beforeSet() should throw an error if the function value 'modelClass' config does not reference a Model class" : function() {
					var mockModel = JsMockito.mock( Model ),
					    oldValue;  // undefined
					
					var attribute = new ModelAttribute( { 
						name: 'attr',
						modelClass: function() {
							return;  // undefined
						}
					} );
					
					var data = { attr1: 1, attr2: 2 },
					    value = attribute.beforeSet( mockModel, data, oldValue );
					
					Y.Assert.fail( "The test should have thrown an error in the call to attribute.beforeSet()" );
				},
				
				
				// ---------------------------
				
				// Test conversions from an object to a Model
				
				
				"beforeSet() should convert an anonymous data object to the provided modelClass, when modelClass is a direct reference to the Model subclass" : function() {
					var mockModel = JsMockito.mock( Model ),
					    data = { attr1: 1, attr2: 2 },
					    oldValue,  // undefined
					    value = this.attribute.beforeSet( mockModel, data, oldValue );
					
					Y.Assert.isInstanceOf( this.Model, value, "The return value from beforeSet should have been an instance of the Model" );
					Y.Assert.areSame( 1, value.get( 'attr1' ), "The data should have been set to the new model" );
					Y.Assert.areSame( 2, value.get( 'attr2' ), "The data should have been set to the new model" );
				},
				
				
				"beforeSet() should convert an anonymous data object to the provided modelClass, when modelClass is a string" : function() {
					// Use a deeply nested namespace, as that will probably be what is used
					window.__Data_CollectionAttributeTest = {};
					window.__Data_CollectionAttributeTest.ns1 = {};
					window.__Data_CollectionAttributeTest.ns1.ns2 = {};
					window.__Data_CollectionAttributeTest.ns1.ns2.MyModel = Model.extend( {
						attributes : [ 'attr1', 'attr2' ]
					} );
					
					var mockModel = JsMockito.mock( Model ),
					    oldValue;  // undefined
					
					var attribute = new ModelAttribute( { 
						name: 'attr',
						modelClass: '__Data_CollectionAttributeTest.ns1.ns2.MyModel'
					} );
					
					var data = { attr1: 1, attr2: 2 };
					var value = attribute.beforeSet( mockModel, data, oldValue );
					
					Y.Assert.isInstanceOf( window.__Data_CollectionAttributeTest.ns1.ns2.MyModel, value, "The return value from beforeSet should have been an instance of the Model" );
					Y.Assert.areSame( 1, value.get( 'attr1' ), "The data should have been set to the new model" );
					Y.Assert.areSame( 2, value.get( 'attr2' ), "The data should have been set to the new model" );
				},
				
				
				"beforeSet() should convert an anonymous data object to the provided modelClass, when modelClass is a function" : function() {
					var TestModel = Model.extend( {
						attributes : [ 'attr1', 'attr2' ]
					} );
					
					var mockModel = JsMockito.mock( Model ),
					    oldValue;  // undefined
					
					var attribute = new ModelAttribute( { 
						name: 'attr',
						modelClass: function() {
							return TestModel;   // for late binding
						}
					} );
					
					var data = { attr1: 1, attr2: 2 };
					var value = attribute.beforeSet( mockModel, data, oldValue );
					
					Y.Assert.isInstanceOf( TestModel, value, "The return value from beforeSet should have been an instance of the Model" );
					Y.Assert.areSame( 1, value.get( 'attr1' ), "The data should have been set to the new model" );
					Y.Assert.areSame( 2, value.get( 'attr2' ), "The data should have been set to the new model" );
				},
				
				
				"beforeSet() should return an actual Model instance unchanged" : function() {
					var mockModel = JsMockito.mock( Model ),
					    oldValue,  // undefined
					    data = new this.Model( { attr1 : 1, attr2: 2 } ),
					    value = this.attribute.beforeSet( mockModel, data, oldValue );
					
					Y.Assert.areSame( data, value, "The return value from beforeSet should have been the same model instance" );
					Y.Assert.areSame( 1, value.get( 'attr1' ), "The data should remain set to the new model" );
					Y.Assert.areSame( 2, value.get( 'attr2' ), "The data should remain set to the new model" );
				},
				
				
				// --------------------
				
				
				"if no modelClass was provided, beforeSet() should return an anonymous data object unchanged" : function() {
					var mockModel = JsMockito.mock( Model ),
					    oldValue;
					
					var attribute = new ModelAttribute( { 
						name: 'attr'
					} );
					
					var data = { attr1: 1, attr2: 2 };
					var value = attribute.beforeSet( mockModel, data, oldValue );
					
					Y.Assert.areSame( data, value );
				}
			},		
			
			
			
			/*
			 * Test afterSet()
			 */
			{
				name : "Test afterSet()",
				
				
				"afterSet() should return the model (i.e. it doesn't forget the return statement!)" : function() {
					var mockModel = JsMockito.mock( Model );
					
					var attribute = new ModelAttribute( { 
						name: 'attr'
					} );
					
					var value = attribute.afterSet( mockModel, mockModel );  // just pass itself for the value, doesn't matter
					Y.Assert.areSame( mockModel, value );
				}
				
			}
				
			
		]
		
	} ) );
} );