/*global define, window, describe, beforeEach, afterEach, it, expect */
define( [
	'jquery',
	'data/Data',
	'data/Collection',
	'data/Model',
	'data/persistence/proxy/Proxy'
], function( jQuery, Data, Collection, Model, Proxy ) {

	describe( "Integration: Collection with Models", function() {
		
		// A concrete Proxy class for tests to use.
		var ConcreteProxy = Proxy.extend( {
			// Implementation of abstract interface
			create: Data.emptyFn,
			read: Data.emptyFn,
			update: Data.emptyFn,
			destroy: Data.emptyFn
		} );
		
		
		describe( "Test Model Events", function() {
			
			it( "changing an attribute in a model should fire a general 'change' event in the Collection", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attr' ]
				} );
				
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var model1 = new MyModel( { attr: 'model1Value1' } ),
				    model2 = new MyModel( { attr: 'model2Value1' } ),
				    collection = new MyCollection( [ model1, model2 ] );
				
				var changeEventCallCount = 0,
				    changeEventCollection,
				    changeEventModel,
				    changeEventAttributeName,
				    changeEventNewValue,
				    changeEventOldValue;
				    
				collection.on( 'change', function( collection, model, attributeName, newValue, oldValue ) {
					changeEventCallCount++;
					changeEventCollection = collection;
					changeEventModel = model;
					changeEventAttributeName = attributeName;
					changeEventNewValue = newValue;
					changeEventOldValue = oldValue;
				} );
				
				model1.set( 'attr', 'model1Value2' );
				expect( changeEventCallCount ).toBe( 1 );  // orig YUI Test err msg: "The call count should now be exactly 1"
				expect( changeEventCollection ).toBe( collection );  // orig YUI Test err msg: "The event for model1 should have been fired with the collection that changed"
				expect( changeEventModel ).toBe( model1 );  // orig YUI Test err msg: "The event for model1 should have been fired with the model that changed"
				expect( changeEventAttributeName ).toBe( 'attr' );  // orig YUI Test err msg: "The event for model1 should have been fired with the correct attribute name"
				expect( changeEventNewValue ).toBe( 'model1Value2' );  // orig YUI Test err msg: "The event for model1 should have been fired with the new value"
				expect( changeEventOldValue ).toBe( 'model1Value1' );  // orig YUI Test err msg: "The event for model1 should have been fired with the old value"
				
				model2.set( 'attr', 'model2Value2' );
				expect( changeEventCallCount ).toBe( 2 );  // orig YUI Test err msg: "The call count should now be exactly 2"
				expect( changeEventCollection ).toBe( collection );  // orig YUI Test err msg: "The event for model2 should have been fired with the collection that changed"
				expect( changeEventModel ).toBe( model2 );  // orig YUI Test err msg: "The event for model2 should have been fired with the model that changed"
				expect( changeEventAttributeName ).toBe( 'attr' );  // orig YUI Test err msg: "The event for model2 should have been fired with the correct attribute name"
				expect( changeEventNewValue ).toBe( 'model2Value2' );  // orig YUI Test err msg: "The event for model2 should have been fired with the new value"
				expect( changeEventOldValue ).toBe( 'model2Value1' );  // orig YUI Test err msg: "The event for model2 should have been fired with the old value"
			} );
			
			
			it( "changing an attribute in a model should fire an attribute-specific 'change' event in the Collection", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attr' ]
				} );
				
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var model1 = new MyModel( { attr: 'model1Value1' } ),
				    model2 = new MyModel( { attr: 'model2Value1' } ),
				    collection = new MyCollection( [ model1, model2 ] );
				
				var changeEventCallCount = 0,
				    changeEventCollection,
				    changeEventModel,
				    changeEventNewValue,
				    changeEventOldValue;
				    
				collection.on( 'change:attr', function( collection, model, newValue, oldValue ) {
					changeEventCallCount++;
					changeEventCollection = collection;
					changeEventModel = model;
					changeEventNewValue = newValue;
					changeEventOldValue = oldValue;
				} );
				
				model1.set( 'attr', 'model1Value2' );
				expect( changeEventCallCount ).toBe( 1 );  // orig YUI Test err msg: "The call count should now be exactly 1"
				expect( changeEventCollection ).toBe( collection );  // orig YUI Test err msg: "The event for model1 should have been fired with the collection that changed"
				expect( changeEventModel ).toBe( model1 );  // orig YUI Test err msg: "The event for model1 should have been fired with the model that changed"
				expect( changeEventNewValue ).toBe( 'model1Value2' );  // orig YUI Test err msg: "The event for model1 should have been fired with the new value"
				expect( changeEventOldValue ).toBe( 'model1Value1' );  // orig YUI Test err msg: "The event for model1 should have been fired with the old value"
				
				model2.set( 'attr', 'model2Value2' );
				expect( changeEventCallCount ).toBe( 2 );  // orig YUI Test err msg: "The call count should now be exactly 2"
				expect( changeEventCollection ).toBe( collection );  // orig YUI Test err msg: "The event for model2 should have been fired with the collection that changed"
				expect( changeEventModel ).toBe( model2 );  // orig YUI Test err msg: "The event for model2 should have been fired with the model that changed"
				expect( changeEventNewValue ).toBe( 'model2Value2' );  // orig YUI Test err msg: "The event for model2 should have been fired with the new value"
				expect( changeEventOldValue ).toBe( 'model2Value1' );  // orig YUI Test err msg: "The event for model2 should have been fired with the old value"
			} );
			
			
			it( "Any event that the Model fires should be relayed by the Collection", function() {
				var MyModel = Model.extend( {
					initialize : function() {
						this.addEvents( 'testevent' );
					}, 
					
					attributes : [ 'attr' ]
				} );
				
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    collection = new MyCollection( [ model1, model2 ] );
				
				var testEventCallCount = 0,
				    testEventCollection,
				    testEventModel,
				    testEventArg1,
				    testEventArg2,
				    testEventArg3;
				
				collection.on( 'testevent', function( collection, model, arg1, arg2, arg3 ) {
					testEventCallCount++;
					testEventCollection = collection;
					testEventModel = model;
					testEventArg1 = arg1;
					testEventArg2 = arg2;
					testEventArg3 = arg3;
				} );
				
				model1.fireEvent( 'testevent', model1, 1, 2, 3 );
				expect( testEventCallCount ).toBe( 1 );  // orig YUI Test err msg: "The testevent should have been called exactly once"
				expect( testEventCollection ).toBe( collection );  // orig YUI Test err msg: "The testevent should have been called with the collection (as it was provided)"
				expect( testEventModel ).toBe( model1 );  // orig YUI Test err msg: "The testevent should have been called with the model (as it was provided)"
				expect( testEventArg1 ).toBe( 1 );  // orig YUI Test err msg: "arg1 should have been provided"
				expect( testEventArg2 ).toBe( 2 );  // orig YUI Test err msg: "arg2 should have been provided"
				expect( testEventArg3 ).toBe( 3 );  // orig YUI Test err msg: "arg3 should have been provided"
			} );
			
			
			it( "After a model has been removed from the Collection, the collection should no longer relay its events", function() {
				var MyModel = Model.extend( {
					initialize : function() {
						this.addEvents( 'testevent' );
					}, 
					
					attributes : [ 'attr' ]
				} );
				
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    collection = new MyCollection( [ model1, model2 ] );
				
				var testEventCallCount = 0;
				
				collection.on( 'testevent', function() {
					testEventCallCount++;
				} );
				
				// Remove the model before firing the event
				collection.remove( model1 );
				
				model1.fireEvent( 'testevent' );
				expect( testEventCallCount ).toBe( 0 );  // orig YUI Test err msg: "The testevent should *not* have been fired from the collection, as the child model was removed"
			} );
			
		} );
		
		
		describe( "Test isModified()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 
						{ name : 'attr' },
						{ name : 'persistedAttr', type: 'string' },
						{ name : 'unpersistedAttr', type: 'string', persist: false } 
					]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "isModified() should return false if no Models within the collection have been modified", function() {
				var model1 = new thisSuite.Model( { attr: 1 } ),
				    model2 = new thisSuite.Model( { attr: 2 } ),
				    collection = new thisSuite.Collection( [ model1, model2 ] );
								
				expect( collection.isModified() ).toBe( false );
			} );
			
			
			it( "isModified() should return true if a Model within the collection has been modified", function() {
				var model1 = new thisSuite.Model( { attr: 1 } ),
				    model2 = new thisSuite.Model( { attr: 2 } ),
				    collection = new thisSuite.Collection( [ model1, model2 ] );
				
				model1.set( 'attr', 42 );
				
				expect( collection.isModified() ).toBe( true );
			} );
			
			
			it( "isModified() should return false if a Model within the collection has been modified, but then rolled back or committed", function() {
				var model1 = new thisSuite.Model( { attr: 1 } ),
				    model2 = new thisSuite.Model( { attr: 2 } ),
				    collection = new thisSuite.Collection( [ model1, model2 ] );
				
				model1.set( 'attr', 42 );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "Just double checking that the collection is considered modified, before rolling back"
				model1.rollback();
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Should be false after rollback"
				
				
				model1.set( 'attr', 42 );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "Just double checking that the collection is considered modified again, before committing"
				model1.commit();
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Should be false after commit"
			} );
			
			
			it( "With the 'persistedOnly' option, isModified() should only return true if one of its models has a persisted attribute that has been changed", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    collection = new thisSuite.Collection( [ model1, model2 ] );
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				expect( collection.isModified( { persistedOnly: true } ) ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified with the 'persistedOnly' option set"
				
				model2.set( 'persistedAttr', 'newValue' );
				expect( collection.isModified( { persistedOnly: true } ) ).toBe( true );  // orig YUI Test err msg: "The collection should now be considered modified, as it has a model with a persisted attribute that has been modified"
			} );
			
			
			it( "With the 'persistedOnly' option, isModified() should return false if none of its models have a persisted attribute that has been changed", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    collection = new thisSuite.Collection( [ model1, model2 ] );
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				expect( collection.isModified( { persistedOnly: true } ) ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified with the 'persistedOnly' option set"
				
				model2.set( 'unpersistedAttr', 'newValue' );
				expect( collection.isModified( { persistedOnly: true } ) ).toBe( false );  // orig YUI Test err msg: "The collection should *not* be considered modified, as its models only have unpersisted attribute changes"
			} );
			
		} );
		
		
		describe( "Test destroying a model. It should be removed from the collection.", function() {
			
			it( "When a model is destroyed, it should be removed from the collection. The collection should also fire the 'remove' event", function() {
				var removeEventCount = 0;
				
				var MyModel = Model.extend( {
					attributes : [ 'attr' ],
					proxy : new ConcreteProxy()
				} );
				
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var model1 = new MyModel( { attr: 1 } ),
				    model2 = new MyModel( { attr: 2 } ),
				    collection = new MyCollection( [ model1, model2 ] );
				
				collection.on( 'remove', function() {
					removeEventCount++;
				} );
				
				expect( collection.has( model1 ) ).toBe( true );  // orig YUI Test err msg: "Initial condition: the collection should have model1"
				
				model1.destroy();
				expect( collection.has( model1 ) ).toBe( false );  // orig YUI Test err msg: "model1 should have been removed from the collection upon destruction"
				expect( removeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'remove' event should have been fired exactly once by the Collection"
			} );
			
		} );
		
	} );
} );