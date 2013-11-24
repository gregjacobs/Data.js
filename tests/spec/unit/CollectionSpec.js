/*global define, window, describe, beforeEach, afterEach, it, xit, expect, spyOn, JsMockito */
define( [
	'jquery',
	'lodash',
	
	'data/Data',
	'data/Collection',
	'data/Model',
	'data/attribute/Attribute',
	
	'data/persistence/ResultSet',
	'data/persistence/proxy/Proxy',
	'data/persistence/proxy/Ajax',
	'data/persistence/proxy/Memory',
	'data/persistence/request/Read',
	'data/persistence/operation/Load',
	
	'spec/lib/ManualProxy',
	'spec/lib/CollectionPersistenceVerifier',
	
	'spec/unit/CollectionSpec.LoadTestCreator',
	'spec/unit/CollectionSpec.LoadRangeTestCreator',
	'spec/unit/CollectionSpec.LoadPageTestCreator',
	'spec/unit/CollectionSpec.LoadPageRangeTestCreator'
], function(
	jQuery,
	_,
	
	Data,
	Collection,
	Model,
	Attribute,
	
	ResultSet,
	Proxy,
	AjaxProxy,
	MemoryProxy,
	ReadRequest,
	LoadOperation,
	
	ManualProxy,
	CollectionPersistenceVerifier,
	
	LoadTestCreator,
	LoadRangeTestCreator,
	LoadPageTestCreator,
	LoadPageRangeTestCreator
) {
	
	describe( "data.Collection", function() {
		
		// Concrete proxy implementation which simply implements the abstract interface
		var ConcreteProxy = Proxy.extend( {
			create : Data.emptyFn,
			read : Data.emptyFn,
			update : Data.emptyFn,
			destroy : Data.emptyFn
		} );
		
			
		describe( "onClassCreated() static method", function() {
			
			// check that functionality from the superclass onClassCreated (i.e. DataComponent's onClassCreated()) is still executed
			it( "should allow the superclass to instantiate an anonymous proxy config object into a Proxy instance", function() {
				var MyCollection = Collection.extend( {
					proxy : {
						type : 'memory'
					}
				} );
				
				var proxy = MyCollection.getProxy();
				expect( proxy instanceof MemoryProxy ).toBe( true );
			} );
			
		} );
		
		
		describe( "constructor", function() {
			var MyModel = Model.extend( {
				attributes : [ 'attr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "The constructor should accept a configuration object to initialize the Collection with an initial set of data/models and any other custom configs", function() {
				var model = new MyModel( { attr: 'value1' } );
				
				var collection = new MyCollection( {
					data: model,
					customConfig: 1
				} );
				
				var models = collection.getModels();
				expect( models.length ).toBe( 1 );  // orig YUI Test err msg: "There should now be one model in the collection"
				expect( models[ 0 ] ).toBe( model );  // orig YUI Test err msg: "The model in the collection should be the one provided to the 'models' config"
				
				// Check that the custom config was applied to the collection
				expect( collection.customConfig ).toBe( 1 );  // orig YUI Test err msg: "The customConfig should have been applied to the collection"
			} );
			
			
			it( "The constructor should accept an array of Models to initialize the Collection with", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    collection = new MyCollection( [ model1, model2 ] );
				
				var models = collection.getModels();
				expect( models.length ).toBe( 2 );  // orig YUI Test err msg: "There should now be two models in the collection"
				expect( models[ 0 ] ).toBe( model1 );  // orig YUI Test err msg: "The first model should be the first model provided to the constructor"
				expect( models[ 1 ] ).toBe( model2 );  // orig YUI Test err msg: "The second model should be the second model provided to the constructor"
			} );
			
			
			it( "The constructor should attach listeners provided by the `listeners` config", function() {
				var addCallCount = 0;  // used for testing if the event was fired
				
				var collection = new MyCollection( {
					listeners : {
						'add' : function() { addCallCount++; }
					}
				} );
				
				collection.fireEvent( 'add' );
				expect( addCallCount ).toBe( 1 );  // orig YUI Test err msg: "The 'add' event should have been fired, and the handler attached via config should have been called"
			} );
			
			
			it( "The constructor should not call the load() method if `autoLoad` is false", function() {
				var loadCallCount = 0;
				var MyCollection2 = MyCollection.extend( {
					load : function() {  // redefine load() method
						loadCallCount++;
					}
				} );
				
				var collection = new MyCollection2( {
					autoLoad : false
				} );
				expect( loadCallCount ).toBe( 0 );  // orig YUI Test err msg: "load() shouldn't have been called"
			} );
			
			
			it( "The constructor should call the load() method immediately if `autoLoad` is true, and no initial `data` config is specified", function() {
				var loadCallCount = 0;
				var MyCollection2 = MyCollection.extend( {
					load : function() {  // redefine load() method
						loadCallCount++;
					}
				} );
				
				var collection = new MyCollection2( {
					autoLoad : true
				} );
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "load() should have been called"
			} );
			
			
			it( "The constructor should *not* call the load() method if `autoLoad` is true, but an initial `data` config has been specified", function() {
				var loadCallCount = 0;
				var MyCollection2 = MyCollection.extend( {
					load : function() {  // redefine load() method
						loadCallCount++;
					}
				} );
				
				var collection = new MyCollection2( {
					autoLoad : true,
					data : [ 
						new MyModel( { attr: 1 } )
					]
				} );
				expect( loadCallCount ).toBe( 0 );  // orig YUI Test err msg: "load() shouldn't have been called"
			} );
			
		} );
		
		
		describe( 'createModel()', function() {
			
			it( "createModel() should take an anonymous config object, and transform it into a Model instance, based on the 'model' config", function() {
				var MyModel = Model.extend( {
					attributes : [ 'attr' ]
				} );
				
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var collection = new MyCollection();
				var model = collection.createModel( { attr: 'testValue' } );
				
				expect( model instanceof MyModel ).toBe( true );
				expect( model.get( 'attr' ) ).toBe( 'testValue' );
			} );
			
		} );
		
		
		describe( 'add()', function() {
			var MyModel = Model.extend( {
				attributes : [ 'attr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "add() should be able to add a single Model instance to the Collection", function() {
				var collection = new MyCollection(),
				    model = new MyModel( { attr: 'value' } ),
				    models;
				
				models = collection.getModels();
				expect( models.length ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: There should be no models in the collection"
				
				collection.add( model );
				
				models = collection.getModels();
				expect( models.length ).toBe( 1 );  // orig YUI Test err msg: "There should now be one model in the collection"
				expect( models[ 0 ] ).toBe( model );  // orig YUI Test err msg: "The model added should be the first model in the collection"
			} );
			
			
			it( "add() should be able to add an array of Model instances to the Collection", function() {
				var collection = new MyCollection(),
				    model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    models;
				
				models = collection.getModels();
				expect( models.length ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: There should be no models in the collection"
				
				collection.add( [ model1, model2 ] );
				
				models = collection.getModels();
				expect( models.length ).toBe( 2 );  // orig YUI Test err msg: "There should now be two models in the collection"
				expect( models[ 0 ] ).toBe( model1 );  // orig YUI Test err msg: "The first model added in the array should be the first model in the collection"
				expect( models[ 1 ] ).toBe( model2 );  // orig YUI Test err msg: "The second model added in the array should be the second model in the collection"
			} );
			
			
			it( "inserting (adding) one or more models should have the Collection considered as 'modified'", function() {
				var collection = new MyCollection(),
				    model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    models;
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be modified"
				
				collection.add( model1 );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be considered modified"
			} );
			
			
			it( "add() should be able to add a single Model instance to the Collection at a specified index", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    model3 = new MyModel( { attr: 'value3' } ),
				    collection = new MyCollection( [ model1, model2 ] ), // only inserting model1 and model2 for now
				    models;
				
				models = collection.getModels();
				expect( models.length ).toBe( 2 );  // orig YUI Test err msg: "Initial condition: There should be 2 models in the collection"
				
				// Now insert model3 in the middel
				collection.add( model3, { at: 1 } );
				
				models = collection.getModels();
				expect( models.length ).toBe( 3 );  // orig YUI Test err msg: "There should now be 3 models in the collection"
				expect( models ).toEqual( [ model1, model3, model2 ] );  // orig YUI Test err msg: "model3 should have been added in the middle"
			} );
			
			
			it( "add() should be able to add an array of Model instance to the Collection at a specified index", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    model3 = new MyModel( { attr: 'value3' } ),
				    model4 = new MyModel( { attr: 'value4' } ),
				    collection = new MyCollection( [ model1, model2 ] ), // only inserting model1 and model2 for now
				    models;
				
				models = collection.getModels();
				expect( models.length ).toBe( 2 );  // orig YUI Test err msg: "Initial condition: There should be 2 models in the collection"
				
				// Now insert model3 and model4 in the middel
				collection.add( [ model3, model4 ], { at: 1 } );
				
				models = collection.getModels();
				expect( models.length ).toBe( 4 );  // orig YUI Test err msg: "There should now be 4 models in the collection"
				expect( models ).toEqual( [ model1, model3, model4, model2 ] );  // orig YUI Test err msg: "model3 and model4 should have been added in the middle"
			} );
			
			
			it( "add() should fire the 'add' event for a single inserted model", function() {
				var collection = new MyCollection(),
				    model = new MyModel( { attr: 'value' } ),
				    models;
				
				var addEventCount = 0,
				    addedModel;
				    
				collection.on( 'add', function( collection, model ) {
					addEventCount++;
					addedModel = model;
				} );
				collection.add( model );
				
				expect( addEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'add' event should have been fired exactly once"
				expect( addedModel ).toBe( model );  // orig YUI Test err msg: "The model provided with the 'add' event should be the model added to the collection"
			} );
			
			
			it( "add() should fire the 'add' event one time for each of multiple inserted models", function() {
				var collection = new MyCollection(),
				    model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    models;
				
				
				var addEventCount = 0,
				    addedModels = [];
				    
				collection.on( 'add', function( collection, model ) {
					addEventCount++;
					addedModels.push( model );
				} );
				collection.add( [ model1, model2 ] );
				
				expect( addEventCount ).toBe( 2 );  // orig YUI Test err msg: "The 'add' event should have been fired exactly twice"
				expect( addedModels[ 0 ] ).toBe( model1 );  // orig YUI Test err msg: "The first model added should be the first model added to the collection"
				expect( addedModels[ 1 ] ).toBe( model2 );  // orig YUI Test err msg: "The second model added should be the second model added to the collection"
			} );
			
			
			it( "add() should *not* fire the 'add' event for a model that is already in the Collection", function() {
				var model = new MyModel( { attr: 'value1' } ),
				    collection = new MyCollection( [ model ] );  // initally add the model
				
				var addEventFired = false;
				collection.on( 'add', function( collection, model ) {
					addEventFired = true;
				} );
				collection.add( model );
				
				expect( addEventFired ).toBe( false );  // orig YUI Test err msg: "The 'add' event should not have been fired for another insert of the same model"
			} );
			
			
			it( "add() should *not* fire the 'add' event for models that are already in the Collection when multiple models are inserted, and only some exist already", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    collection = new MyCollection( [ model1 ] );  // initally add model1
				
				var addEventCount = 0,
				    addedModels = [];
				    
				collection.on( 'add', function( collection, model ) {
					addEventCount++;
					addedModels.push( model );
				} );
				collection.add( [ model1, model2 ] );  // now insert model1 and model2. Only model2 should really have been "added"
				
				expect( addEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'add' event should have been fired exactly once"
				expect( addedModels ).toEqual( [ model2 ] );  // orig YUI Test err msg: "The 'add' event should have only fired with the model that was actually added"
			} );
			
			
			it( "add() should fire the 'addset' event with the array of inserted models, even if only one model is inserted", function() {
				var collection = new MyCollection(),
				    model = new MyModel( { attr: 'value' } ),
				    models;
				
				var addedModels;
				collection.on( 'addset', function( collection, models ) {
					addedModels = models;
				} );
				collection.add( model );
				
				expect( addedModels.length ).toBe( 1 );  // orig YUI Test err msg: "1 model should have been provided to the 'addset' event"
				expect( addedModels[ 0 ] ).toBe( model );  // orig YUI Test err msg: "The model provided with the 'addset' event should be the model added to the collection"
			} );
			
			
			it( "add() should fire the 'addset' event with the array of inserted models when multiple models are inserted", function() {
				var collection = new MyCollection(),
				    model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    models;
				
				var addedModels;
				collection.on( 'addset', function( collection, models ) {
					addedModels = models;
				} );
				collection.add( [ model1, model2 ] );
				
				expect( addedModels.length ).toBe( 2 );  // orig YUI Test err msg: "2 models should have been provided to the 'addset' event"
				expect( addedModels[ 0 ] ).toBe( model1 );  // orig YUI Test err msg: "The first model added in the array should be the first model added to the collection"
				expect( addedModels[ 1 ] ).toBe( model2 );  // orig YUI Test err msg: "The second model added in the array should be the second model added to the collection"
			} );
			
			
			it( "add() should *not* fire the 'addset' event for a model that is already in the Collection", function() {
				var model = new MyModel( { attr: 'value1' } ),
				    collection = new MyCollection( [ model ] );  // initally add the model
				
				var addEventFired = false;
				collection.on( 'addset', function( collection, models ) {
					addEventFired = true;
				} );
				collection.add( model );
				
				expect( addEventFired ).toBe( false );  // orig YUI Test err msg: "The 'addset' event should not have been fired for another insert of the same model"
			} );
			
			
			it( "add() should *not* fire the 'addset' event for models that are already in the Collection when multiple models are inserted, and only some exist already", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    collection = new MyCollection( [ model1 ] );  // initally add model1
				
				var addedModels;
				collection.on( 'addset', function( collection, models ) {
					addedModels = models;
				} );
				collection.add( [ model1, model2 ] );  // now insert model1 and model2. Only model2 should really have been "added"
				
				expect( addedModels ).toEqual( [ model2 ] );  // orig YUI Test err msg: "The 'addset' event should have only fired with the model that was actually added"
			} );
			
			
			it( "add() should reorder models when they already exist in the Collection", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    model3 = new MyModel( { attr: 'value3' } ),
				    collection = new MyCollection( [ model1, model2, model3 ] ),
				    models;
				
				collection.add( model3, { at: 0 } );
				expect( collection.getModels() ).toEqual( [ model3, model1, model2 ] );  // orig YUI Test err msg: "add() should have moved model3 to the beginning"
				
				collection.add( [ model2, model1 ], { at: 0 } );
				expect( collection.getModels() ).toEqual( [ model2, model1, model3 ] );  // orig YUI Test err msg: "add() should have moved model2 and model1 to the beginning"
				
				collection.add( model2, { at: 2 } );
				expect( collection.getModels() ).toEqual( [ model1, model3, model2 ] );  // orig YUI Test err msg: "add() should have moved model2 to the end"
				
				
				// Try attempting to move models to out-of-bound indexes (they should be normalized)
				collection.add( model2, { at: -1000 } );
				expect( collection.getModels() ).toEqual( [ model2, model1, model3 ] );  // orig YUI Test err msg: "add() should have moved model2 to the beginning with an out of bounds negative index"
				
				collection.add( [ model1, model2 ], { at: 1000 } );
				expect( collection.getModels() ).toEqual( [ model3, model1, model2 ] );  // orig YUI Test err msg: "add() should have moved model1 and model2 to the end with an out of bounds positive index"
			} );
			
			
			it( "add() should fire the 'reorder' event when reordering models", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    model3 = new MyModel( { attr: 'value3' } ),
				    collection = new MyCollection( [ model1, model2, model3 ] ),
				    models;
				
				var reorderEventCallCount = 0,
				    reorderedModels = [],      // all of these are
				    reorderedNewIndexes = [],  // arrays, for when we test
				    reorderedOldIndexes = [];  // reordering multiple models at once
				    
				collection.on( 'reorder', function( collection, model, newIndex, oldIndex ) {
					reorderEventCallCount++;
					reorderedModels.push( model );
					reorderedNewIndexes.push( newIndex );
					reorderedOldIndexes.push( oldIndex );
				} );
				
				collection.add( model3, { at: 0 } );
				expect( collection.getModels() ).toEqual( [ model3, model1, model2 ] );  // orig YUI Test err msg: "The models should be in the correct new order (this is mostly here to just show which order the collection should now be in)"
				expect( reorderEventCallCount ).toBe( 1 );  // orig YUI Test err msg: "The reorder event should have been fired exactly once"
				expect( reorderedModels ).toEqual( [ model3 ] );  // orig YUI Test err msg: "model3 should have been fired with a 'reorder' event (and that is the only reorder event that should have been fired)"
				expect( reorderedNewIndexes ).toEqual( [ 0 ] );  // orig YUI Test err msg: "the new index for model3 should have been reported as index 0"
				expect( reorderedOldIndexes ).toEqual( [ 2 ] );  // orig YUI Test err msg: "the old index for model3 should have been reported as index 2"
				
				
				// Reset the result variables first
				reorderEventCallCount = 0;
				reorderedModels = [];
				reorderedNewIndexes = [];
				reorderedOldIndexes = [];
				
				collection.add( [ model1, model2 ], { at: 0 } );  // move model1 and model2 back to the beginning
				expect( collection.getModels() ).toEqual( [ model1, model2, model3 ] );  // orig YUI Test err msg: "The models should be in the correct new order (this is mostly here to just show which order the collection should now be in)"
				expect( reorderEventCallCount ).toBe( 2 );  // orig YUI Test err msg: "The reorder event should have been fired exactly twice"
				expect( reorderedModels ).toEqual( [ model1, model2 ] );  // orig YUI Test err msg: "model1 and model2 should have been fired with a 'reorder' events"
				expect( reorderedNewIndexes ).toEqual( [ 0, 1 ] );  // orig YUI Test err msg: "the new indexes for model1 and model2 should have been reported as index 0, and 1, respectively"
				expect( reorderedOldIndexes ).toEqual( [ 1, 2 ] );  // orig YUI Test err msg: "the old indexes for model1 and model2 should have been reported as index 1, and 2, respectively"
			} );
			
			
			it( "in a 'reorder' event handler, the new order of the models should be present immediately (getModels should return the models in the new order, inside a handler)", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    model3 = new MyModel( { attr: 'value3' } ),
				    collection = new MyCollection( [ model1, model2, model3 ] ),
				    models;
				
				var modelsInReorderHandler;
				collection.on( 'reorder', function( collection, model, newIndex, oldIndex ) {
					modelsInReorderHandler = collection.getModels();
				} );
				
				collection.add( model3, { at: 1 } );
				expect( modelsInReorderHandler ).toEqual( [ model1, model3, model2 ] );	
				
				collection.add( model1, { at: 1 } );
				expect( modelsInReorderHandler ).toEqual( [ model3, model1, model2 ] );
			} );
			
			
			it( "After a reorder, the Collection should be considered 'modified'", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    model3 = new MyModel( { attr: 'value3' } ),
				    collection = new MyCollection( [ model1, model2, model3 ] ),
				    models;
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not yet be considered 'modified'"
				
				collection.add( model3, { at: 1 } );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be considered modified, since there has been a reorder"
			} );
			
			
			it( "add() should *not* reorder models when calling add() without the `index` argument (which would be the case as well if add() was called)", function() {
				var model1 = new MyModel( { attr: 'value1' } ),
				    model2 = new MyModel( { attr: 'value2' } ),
				    model3 = new MyModel( { attr: 'value3' } ),
				    collection = new MyCollection( [ model1, model2, model3 ] ),
				    models;
				
				collection.add( model1 );  // supposed append, but model1 is already in the Collection, and an index was not given
				expect( collection.getModels() ).toEqual( [ model1, model2, model3 ] );  // orig YUI Test err msg: "The models should be in the original order, as the supposed 'append' should not have happened because the model was already in the collection, and no new index was given"
			} );
			
			
			it( "add() should transform anonymous data objects to Model instances, based on the 'model' config", function() {
				var collection = new MyCollection(),  // note: MyCollection is configured with MyModel as the 'model'
				    modelData1 = { attr: 'value1' },
				    modelData2 = { attr: 'value2' },
				    models;
				
				models = collection.getModels();
				expect( models.length ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: There should be no models in the collection"
				
				collection.add( [ modelData1, modelData2 ] );
				
				models = collection.getModels();
				expect( models.length ).toBe( 2 );  // orig YUI Test err msg: "There should now be two models in the collection"
				expect( models[ 0 ].get( 'attr' ) ).toBe( 'value1' );  // orig YUI Test err msg: "The first model added in the array should have the data provided from modelData1"
				expect( models[ 1 ].get( 'attr' ) ).toBe( 'value2' );  // orig YUI Test err msg: "The second model added in the array should have the data provided from modelData2"
			} );
			
			
			it( "add() should transform anonymous data objects to Model instances, by calling a user-overridden createModel() method with the data, and an empty object for the options", function() {
				var createModelCallCount = 0;
				
				var MyModel = Model.extend( {
					attributes : [ 'attr' ]
				} );
				
				var CreateModelCollection = Collection.extend( {
					createModel : function( modelData, modelOptions ) {
						createModelCallCount++;
						
						expect( modelData ).toEqual( { attr: 'value' } );
						expect( modelOptions ).toEqual( {} );
						
						return new MyModel( modelData );
					}
				} );
				
				var collection = new CreateModelCollection(),  // note: MyCollection is configured with MyModel as the 'model'
				    modelData = { attr: 'value' },
				    models;
				
				models = collection.getModels();
				expect( models.length ).toBe( 0 );  // Initial condition: There should be no models in the collection
				
				collection.add( [ modelData ] );
				expect( createModelCallCount ).toBe( 1 );
				
				models = collection.getModels();
				expect( models.length ).toBe( 1 );
				expect( models[ 0 ].get( 'attr' ) ).toBe( 'value' );
			} );
			
			
			it( "add() should fire the 'addset' event with instantiated models for any anonymous config objects", function() {
				var collection = new MyCollection(),  // note: MyCollection is configured with MyModel as the 'model'
				    modelData1 = { attr: 'value1' },
				    modelData2 = { attr: 'value2' };
				
				var addedModels;
				collection.on( 'addset', function( collection, models ) {
					addedModels = models;
				} );
				collection.add( [ modelData1, modelData2 ] );
				
				expect( addedModels.length ).toBe( 2 );  // orig YUI Test err msg: "2 models should have been provided to the 'addset' event"
				expect( addedModels[ 0 ].get( 'attr' ) ).toBe( 'value1' );  // orig YUI Test err msg: "The first model added in the array should have the data provided from modelData1"
				expect( addedModels[ 1 ].get( 'attr' ) ).toBe( 'value2' );  // orig YUI Test err msg: "The second model added in the array should have the data provided from modelData2"
			} );
			
			
			it( "add() should insert models in the order specified by the sortBy config, if one is provided", function() {
				var MyModel = Model.extend( {
					attributes : [ 'name' ]
				} );
				
				var MyCollection = Collection.extend( {
					sortBy : function( model1, model2 ) {
						var name1 = model1.get( 'name' ),
						    name2 = model2.get( 'name' );
						    
						return ( name1 < name2 ) ? -1 : ( name1 > name2 ) ? 1 : 0;
					}
				} );
				
				
				var model1 = new MyModel( { name : "A" } ),
				    model2 = new MyModel( { name : "B" } ),
				    model4 = new MyModel( { name : "D" } ),  // intentionally model4. Adding model3 later
				    models;
				
				var collection = new MyCollection();
				collection.add( [ model2, model4, model1 ] );  // Insert models in incorrect order
				
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model2, model4 ] );  // orig YUI Test err msg: "The models should have been re-ordered based on the 'name' attribute"
				
				
				// Now create a new model, and see if it gets inserted in the correct position
				var model3 = new MyModel( { name : "C" } );
				collection.add( model3 );
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model2, model3, model4 ] );  // orig YUI Test err msg: "The models should have been re-ordered based on the 'name' attribute with the new model"
			} );
			
			
			it( "the sortBy() function should be called in the scope of the Collection", function() {
				var attributeNameToSortBy = "";
				
				var MyModel = Model.extend( {
					attributes : [ 'name' ]
				} );
				
				var MyCollection = Collection.extend( {
					// A method, just to make sure sortBy() is called in the correct scope
					getAttributeNameToSortBy : function() {
						return 'name';
					},
					
					sortBy : function( model1, model2 ) {
						attributeNameToSortBy = this.getAttributeNameToSortBy();  // If sortBy() is not called in the correct scope, this method call will fail
						
						return 0;
					}
				} );
				
				var model1 = new MyModel( { name : "A" } ),
				    model2 = new MyModel( { name : "B" } ),
				    model3 = new MyModel( { name : "C" } );
				    
				var collection = new MyCollection();
				collection.add( [ model2, model3, model1 ] );  // Insert models in incorrect order
				
				expect( attributeNameToSortBy ).toBe( 'name' );  // orig YUI Test err msg: "The attributeNameToSortBy variable should have been set by sortBy() being called in the correct scope, able to access its helper method"
			} );
			
			
			it( "add() should not allow duplicate models (at this time. config option to come)", function() {
				var model = new MyModel(),
				    collection = new MyCollection();
				
				collection.add( [ model, model ] );  // try to add the model twice
				expect( collection.getModels() ).toEqual( [ model ] );  // orig YUI Test err msg: "There should only be the one model in the collection at this time"
			} );
			
			
			it( "add() should attach a 'change' listener for changes to the 'idAttribute' of a model, so that its internal modelsById hashmap can be updated if it changes", function() {
				var onModelIdChangeCallCount = 0,
				    newIdValue, oldIdValue;
				
				var MyModel = Model.extend( {
					attributes: [ 'id' ],
					idAttribute: 'id'
				} );
				
				var MyCollection = Collection.extend( {
					// extend onModelIdChange to test if it's being called the correct number of times, and with the correct arguments
					onModelIdChange : function( model, newValue, oldValue ) {
						onModelIdChangeCallCount++;
						newIdValue = newValue;
						oldIdValue = oldValue;
						
						// Now call original method
						this._super( arguments );
					}
				} );
				
				var model = new MyModel();
				var collection = new MyCollection( [ model ] );
				
				model.set( 'id', 1 );
				expect( onModelIdChangeCallCount ).toBe( 1 );  // orig YUI Test err msg: "The onModelIdChange method should have been called exactly once"
				expect( newIdValue ).toBe( 1 );  // orig YUI Test err msg: "The newIdValue should be 1"
				expect( _.isUndefined( oldIdValue ) ).toBe( true );  // orig YUI Test err msg: "The oldIdValue should be undefined"
				
				// As a check, make sure that the model can be retrieved by its ID
				expect( collection.getById( 1 ) ).toBe( model );  // orig YUI Test err msg: "The model should have been able to be retrieved by its ID"
				
				
				// Now set again, to make sure that the modelsById collection was updated correctly
				model.set( 'id', 2 );
				expect( onModelIdChangeCallCount ).toBe( 2 );  // orig YUI Test err msg: "The onModelIdChange method should have been called exactly twice at this point"
				expect( newIdValue ).toBe( 2 );  // orig YUI Test err msg: "The newIdValue should be 2"
				expect( oldIdValue ).toBe( 1 );  // orig YUI Test err msg: "The oldIdValue should be 1"
				
				// As a check, try to access the model by its old ID, and its new one
				expect( collection.getById( 1 ) ).toBe( null );  // orig YUI Test err msg: "The model should no longer be retrievable by its old ID"
				expect( collection.getById( 2 ) ).toBe( model );  // orig YUI Test err msg: "The model should now be retrievable by its new ID"
			} );
			
		} );
		
		
		describe( "Test remove()", function() {
			var MyModel = Model.extend( {
				attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "remove() should be able to remove a single Model from the Collection", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new MyModel( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } ),
				    model4 = new MyModel( { boolAttr: true, numberAttr: 3, stringAttr: "value3" } );
				    
				var collection = new MyCollection( [ model1, model2, model3, model4 ] ),
				    models;
				
				// Test initial condition
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model2, model3, model4 ] );  // orig YUI Test err msg: "Initial condition: the Collection should have 4 models"
				
				collection.remove( model2 );
				models = collection.getModels();
				expect( models ).not.toContain( model2 );  // orig YUI Test err msg: "model2 should no longer exist in the Collection"
				expect( models ).toEqual( [ model1, model3, model4 ] );  // orig YUI Test err msg: "The remaining 3 models should all exist, and be in the correct order"
				
				collection.remove( model4 );
				models = collection.getModels();
				expect( models ).not.toContain( model4 );  // orig YUI Test err msg: "model4 should no longer exist in the Collection"
				expect( models ).toEqual( [ model1, model3 ] );  // orig YUI Test err msg: "The remaining 2 models should all exist, and be in the correct order"
				
				collection.remove( model1 );
				models = collection.getModels();
				expect( models ).not.toContain( model1 );  // orig YUI Test err msg: "model1 should no longer exist in the Collection"
				expect( models ).toEqual( [ model3 ] );  // orig YUI Test err msg: "The remaining model should exist"
				
				collection.remove( model3 );
				models = collection.getModels();
				expect( models ).toEqual( [] );  // orig YUI Test err msg: "There should be no more models left"
			} );
			
			
			it( "remove() should be able to remove an array of Models from the Collection", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new MyModel( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } ),
				    model4 = new MyModel( { boolAttr: true, numberAttr: 3, stringAttr: "value3" } );
				    
				var collection = new MyCollection( [ model1, model2, model3, model4 ] ),
				    models;
				
				// Test initial condition
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model2, model3, model4 ] );  // orig YUI Test err msg: "Initial condition: the Collection should have 4 models"
				
				collection.remove( [ model2, model4 ] );
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model3 ] );  // orig YUI Test err msg: "Only model1 and model3 should remain"
			} );
			
			
			it( "remove() should fire the 'remove' event for a single model that is removed", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				
				var collection = new MyCollection( [ model1, model2 ] );
				
				var removeEventCount = 0,
				    removedModel,
				    removedIndex;
				
				collection.on( 'remove', function( collection, model, index ) {
					removeEventCount++;
					removedModel = model;
					removedIndex = index;
				} );
				
				collection.remove( model2 );
				expect( removeEventCount ).toBe( 1 );  // orig YUI Test err msg: "The 'remove' event should have been fired exactly once"
				expect( removedModel ).toBe( model2 );  // orig YUI Test err msg: "The removed model should have been model2"
				expect( removedIndex ).toBe( 1 );  // orig YUI Test err msg: "model2 should have been removed from index 1"
			} );
			
			
			it( "remove() should fire the 'remove' event once for each of the removed models when multiple models are removed", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new MyCollection( [ model1, model2 ] );
				
				var removeEventCount = 0,
				    removedModels = [],
				    removedIndexes = [];
				    
				collection.on( 'remove', function( collection, model, index ) {
					removeEventCount++;
					removedModels.push( model );
					removedIndexes.push( index );
				} );
				
				collection.remove( [ model1, model2 ] );
				
				expect( removeEventCount ).toBe( 2 );  // orig YUI Test err msg: "The 'remove' event should have been fired exactly twice"
				expect( removedModels ).toEqual( [ model1, model2 ] );  // orig YUI Test err msg: "model1 and model2 should have been removed"
				expect( removedIndexes ).toEqual( [ 0, 0 ] );  // orig YUI Test err msg: "The indexes for each model's removal should have both been 0, as after the first one is removed (at index 0), model2 is moved to index 0, and then removed itself"
			} );
			
			
			it( "remove() should *not* fire the 'remove' event if no models are actually removed", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new MyCollection( [ model1 ] );  // only putting model1 on the collection
				
				var removeEventCalled = false;
				collection.on( 'removeset', function( collection, models ) {
					removeEventCalled = true;
				} );
				
				collection.remove( model2 );  // model2 doesn't exist on the Collection
				expect( removeEventCalled ).toBe( false );  // orig YUI Test err msg: "The 'remove' event should not have been called"
			} );
			
			
			it( "remove() should fire the 'removeset' event with the array of removed models, even if only one model has been removed", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new MyCollection( [ model1, model2 ] );
				
				var removedModels;
				collection.on( 'removeset', function( collection, models ) {
					removedModels = models;
				} );
				
				collection.remove( model2 );
				expect( removedModels ).toEqual( [ model2 ] );
			} );
			
			
			it( "remove() should fire the 'removeset' event with the array of removed models when multiple models are removed", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new MyCollection( [ model1, model2 ] );
				
				var removedModels;
				collection.on( 'removeset', function( collection, models ) {
					removedModels = models;
				} );
				
				collection.remove( [ model1, model2 ] );
				expect( removedModels ).toEqual( [ model1, model2 ] );
			} );
			
			
			it( "remove() should *not* fire the 'removeset' event if no models are actually removed", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new MyCollection( [ model1 ] );
				
				var removeEventCallCount = 0;
				collection.on( 'removeset', function( collection, models ) {
					removeEventCallCount++;
				} );
				
				collection.remove( model2 );  // model2 doesn't exist on the Collection
				expect( removeEventCallCount ).toBe( 0 );
			} );
			
			
			it( "remove() should remove the model from the modelsById hashmap, so it is no longer retrievable by getById", function() {
				var MyModel = Model.extend( {
					attributes: [ 'id' ],
					idAttribute: 'id'
				} );
				
				var model = new MyModel( { id : 1 } ); 
				var collection = new Collection( [ model ] );
				
				expect( collection.getById( 1 ) ).toBe( model );  // orig YUI Test err msg: "Initial condition: the model should be available to getById()"
				
				collection.remove( model );
				expect( collection.getById( 1 ) ).toBe( null );  // orig YUI Test err msg: "The model should no longer be retrievable by getById() after removal"
			} );
			
			
			it( "remove() should remove the model from the modelsByClientId hashmap, so it is no longer retrievable by getById", function() {
				var MyModel = Model.extend( {} ),
				    model = new MyModel(),
				    modelClientId = model.getClientId(),
				    collection = new Collection( [ model ] );
				
				expect( collection.getByClientId( modelClientId ) ).toBe( model );  // orig YUI Test err msg: "Initial condition: the model should be available to getByClientId()"
				
				collection.remove( model );
				expect( collection.getByClientId( modelClientId ) ).toBe( null );  // orig YUI Test err msg: "The model should no longer be retrievable by getByClientId() after removal"
			} );
			
			
			it( "remove() should remove the 'change' listener for changes to the 'idAttribute' of a model, so that its internal modelsById hashmap can be updated if it changes", function() {
				var onModelIdChangeCallCount = 0,
				    newIdValue, oldIdValue;
				
				var MyModel = Model.extend( {
					attributes: [ 'id' ],
					idAttribute: 'id'
				} );
				
				var MyCollection = Collection.extend( {
					// extend onModelIdChange to test if it's being called the correct number of times, and with the correct arguments
					onModelIdChange : function( model, newValue, oldValue ) {
						onModelIdChangeCallCount++;
						newIdValue = newValue;
						oldIdValue = oldValue;
						
						// Now call original method
						this._super( arguments );
					}
				} );
				
				var model = new MyModel();
				var collection = new MyCollection( [ model ] );
				
				model.set( 'id', 1 );
				expect( onModelIdChangeCallCount ).toBe( 1 );  // orig YUI Test err msg: "The onModelIdChange method should have been called exactly once"
				expect( newIdValue ).toBe( 1 );  // orig YUI Test err msg: "The newIdValue should be 1"
				expect( _.isUndefined( oldIdValue ) ).toBe( true );  // orig YUI Test err msg: "The oldIdValue should be undefined"
				
				// As a check, make sure that the model can be retrieved by its ID
				expect( collection.getById( 1 ) ).toBe( model );  // orig YUI Test err msg: "The model should have been able to be retrieved by its ID"
				
				
				// Now remove the model, and make sure that onModelIdChange does *not* get called subsequently
				collection.remove( model );
				
				
				// Now set again, to make sure that the onModelIdChange method does *not* get called
				model.set( 'id', 2 );
				expect( onModelIdChangeCallCount ).toBe( 1 );  // orig YUI Test err msg: "The onModelIdChange method should *not* have been called again at this point"
			} );
			
		} );
		
		
		describe( "Test removeAll()", function() {
			var MyModel = Model.extend( {
				attributes  : [ 'id' ],
				idAttribute : 'id'
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "removeAll() should be able to remove all Models from the Collection", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    model3 = new MyModel(),
				    model4 = new MyModel();
				    
				var collection = new MyCollection( [ model1, model2, model3, model4 ] ),
				    models;
				
				// Test initial condition
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model2, model3, model4 ] );  // orig YUI Test err msg: "Initial condition: the Collection should have 4 models"
				
				collection.removeAll();
				models = collection.getModels();
				expect( models ).toEqual( [] );  // orig YUI Test err msg: "There should be no models left in the collection"
			} );
			
			
			it( "removeAll() should fire the 'remove' event for each of the removed models", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    model3 = new MyModel(),
				    model4 = new MyModel();
				    
				var collection = new MyCollection( [ model1, model2, model3, model4 ] );
				
				var removedModels = [];
				collection.on( 'remove', function( collection, model ) {
					removedModels.push( model );
				} );
				
				collection.removeAll();
				expect( removedModels ).toEqual( [ model1, model2, model3, model4 ] );
			} );
			
			
			it( "removeAll() should fire the 'removeset' event with the array of removed models when multiple models are removed", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    model3 = new MyModel(),
				    model4 = new MyModel();
				    
				var collection = new MyCollection( [ model1, model2, model3, model4 ] );
				
				var removedModels;
				collection.on( 'removeset', function( collection, models ) {
					removedModels = models;
				} );
				
				collection.removeAll();
				expect( removedModels ).toEqual( [ model1, model2, model3, model4 ] );
			} );
			
			
			it( "removeAll() should *not* fire the 'removeset' event if no models are actually removed", function() {
				var collection = new MyCollection();  // no models
				
				var removeEventCallCount = 0;
				collection.on( 'removeset', function( collection, models ) {
					removeEventCallCount++;
				} );
				
				collection.removeAll();  // model2 doesn't exist on the Collection
				expect( removeEventCallCount ).toBe( 0 );
			} );
			
			
			it( "removeAll() should clear the `modelsByClientId` and `modelsById` hashmaps", function() {
				var model1 = new MyModel( { id: 1 } ),
				    model2 = new MyModel( { id: 2 } );
				var collection = new MyCollection( [ model1, model2 ] );
				
				expect( collection.getByClientId( model1.getClientId() ) ).toBe( model1 );  // orig YUI Test err msg: "Initial condition: should be able to retrieve model1 by clientId"
				expect( collection.getById( model1.getId() ) ).toBe( model1 );  // orig YUI Test err msg: "Initial condition: should be able to retrieve model1 by id"
				expect( collection.getByClientId( model2.getClientId() ) ).toBe( model2 );  // orig YUI Test err msg: "Initial condition: should be able to retrieve model2 by clientId"
				expect( collection.getById( model2.getId() ) ).toBe( model2 );  // orig YUI Test err msg: "Initial condition: should be able to retrieve model2 by id"
				
				collection.removeAll();
				
				expect( collection.getByClientId( model1.getClientId() ) ).toBe( null );  // orig YUI Test err msg: "should no longer be able to retrieve model1 by clientId"
				expect( collection.getById( model1.getId() ) ).toBe( null );  // orig YUI Test err msg: "should no longer be able to retrieve model1 by id"
				expect( collection.getByClientId( model2.getClientId() ) ).toBe( null );  // orig YUI Test err msg: "should no longer be able to retrieve model2 by clientId"
				expect( collection.getById( model2.getId() ) ).toBe( null );  // orig YUI Test err msg: "should no longer be able to retrieve model2 by id"
			} );
			
		} );
		
		
		describe( "Test getAt()", function() {
			var MyModel = Model.extend( {
				attributes: [ 'id' ],
				idAttribute: 'id'
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "getAt() should return the model at a given index", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel();
				    
				var collection = new MyCollection( [ model1, model2 ] );
				
				expect( collection.getAt( 0 ) ).toBe( model1 );  // orig YUI Test err msg: "model1 should be at index 0"
				expect( collection.getAt( 1 ) ).toBe( model2 );  // orig YUI Test err msg: "model2 should be at index 1"
			} );
			
			
			it( "getAt() should return null for an index that is out of bounds", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel();
				    
				var collection = new MyCollection( [ model1, model2 ] );
				
				expect( collection.getAt( -1 ) ).toBe( null );  // orig YUI Test err msg: "Should be null for a negative index"
				expect( collection.getAt( 2 ) ).toBe( null );  // orig YUI Test err msg: "Should be null for an index greater than the number of models"
			} );
			
		} );
		
		
		describe( "Test getFirst()", function() {
			var MyModel = Model.extend( {
				attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "getFirst() should retrieve the first Model in the Collection", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    collection = new MyCollection( [ model1, model2 ] );
				    
				expect( collection.getFirst() ).toBe( model1 );
			} );
			
			
			it( "getFirst() should return null if there are no models in the Collection", function() {
				var collection = new MyCollection();
				
				expect( collection.getFirst() ).toBe( null );
			} );
			
		} );
		
		
		describe( "Test getLast()", function() {
			var MyModel = Model.extend( {
				attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "getLast() should retrieve the first Model in the Collection", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    collection = new MyCollection( [ model1, model2 ] );
				    
				expect( collection.getLast() ).toBe( model2 );
			} );
			
			
			it( "getLast() should return null if there are no models in the Collection", function() {
				var collection = new MyCollection();
				
				expect( collection.getLast() ).toBe( null );
			} );
			
		} );
		
		
		describe( "Test getRange()", function() {
			var MyModel = Model.extend( {
				attributes : [ 'attr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "getRange() should retrieve all models when no arguments are provided", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    model3 = new MyModel();
				
				var collection = new MyCollection( [ model1, model2, model3 ] ),
				    models = collection.getRange();
				
				expect( models ).toEqual( [ model1, model2, model3 ] );
			} );
			
			
			it( "getRange() should retrieve models based on just the startIndex argument, defaulting endIndex to the last model in the Collection", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    model3 = new MyModel();
				
				var collection = new MyCollection( [ model1, model2, model3 ] ),
				    models;
				
				models = collection.getRange( 0 );  // attempt to get all models starting at position 0
				expect( models ).toEqual( [ model1, model2, model3 ] );  // orig YUI Test err msg: "All models should have been retrieved"
				
				models = collection.getRange( 1 );  // attempt to get all models starting at position 1
				expect( models ).toEqual( [ model2, model3 ] );  // orig YUI Test err msg: "The second and third models should have been retrieved"
				
				models = collection.getRange( 2 );  // attempt to get all models starting at position 2
				expect( models ).toEqual( [ model3 ] );  // orig YUI Test err msg: "The third model should have been retrieved"
				
				// Try an out-of-range startIndex
				models = collection.getRange( 3 );  // attempt to get all models starting at position 3 (out-of-range)
				expect( models ).toEqual( [] );  // orig YUI Test err msg: "No models should have been retrieved"
			} );
			
			
			it( "getRange() should retrieve models based on the startIndex and endIndex arguments", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    model3 = new MyModel();
				
				var collection = new MyCollection( [ model1, model2, model3 ] ),
				    models;
				
				models = collection.getRange( 0, 0 );
				expect( models ).toEqual( [ model1 ] );  // orig YUI Test err msg: "0, 0 args did not work correctly. First model should have been retrieved"
				
				models = collection.getRange( 0, 1 );
				expect( models ).toEqual( [ model1, model2 ] );  // orig YUI Test err msg: "0, 1 args did not work correctly. First and second model should have been retrieved"
				
				models = collection.getRange( 1, 1 );
				expect( models ).toEqual( [ model2 ] );  // orig YUI Test err msg: "1, 1 args did not work correctly. Second model should have been retrieved"
				
				models = collection.getRange( 1, 2 );
				expect( models ).toEqual( [ model2, model3 ] );  // orig YUI Test err msg: "1, 2 args did not work correctly. Second and third models should have been retrieved"
				
				models = collection.getRange( 0, 2 );
				expect( models ).toEqual( [ model1, model2, model3 ] );  // orig YUI Test err msg: "0, 2 args did not work correctly. Second and third models should have been retrieved"
				
				// Test out-of-range indexes
				models = collection.getRange( -10000, 10000 );
				expect( models ).toEqual( [ model1, model2, model3 ] );  // orig YUI Test err msg: "Out of range -10000, 10000 args did not work correctly. All models should have been retrieved"
			} );
			
		} );
		
		
		describe( "Test hasRange()", function() {
			var MyModel = Model.extend( {
				attributes : [ 'attr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "hasRange() should return true when the Collection has the range of models specified", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    model3 = new MyModel();
				
				var collection = new MyCollection( [ model1, model2, model3 ] );
				expect( collection.hasRange( 0, 2 ) ).toBe( true );
			} );
			
			
			it( "hasRange() should return false when the collection does not have the range of models specified", function() {
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    model3 = new MyModel();
				
				var collection = new MyCollection( [ model1, model2, model3 ] );
				expect( collection.hasRange( 0, 3 ) ).toBe( false );  // looking for 4 models
			} );
			
		} );
		
		
		describe( "Test getModels()", function() {
			
			it( "getModels() should return the array of models, but in a new array so that the array can be changed", function() {
				var MyModel = Model.extend( { attributes: [ 'attr' ] } ),
				    model1 = new MyModel( { attr: 1 } ),
				    model2 = new MyModel( { attr: 2 } ),
				    model3 = new MyModel( { attr: 3 } ),
				    collection = new Collection( [ model1, model2, model3 ] );
				
				var modelsArray = collection.getModels();
				
				// Try removing a model from the array, and make sure that it does not affect the Collection
				modelsArray.splice( 0, 1 );
				expect( modelsArray.length ).toBe( 2 );  // orig YUI Test err msg: "The models array should have been reduced to 2 elements"
				expect( collection.getCount() ).toBe( 3 );  // orig YUI Test err msg: "The number of models in the collection should still be 3"
			} );
			
		} );
		
		
		describe( "Test getData()", function() {
			
			xit( "getData() should delegate to the singleton NativeObjectConverter to create an Array representation of its data", function() {
				var MyModel = Model.extend( {
					attributes: [ 'attr1', 'attr2' ]
				} );
				
				var MyCollection = Collection.extend( {
					model : MyModel
				} );
				
				var collection = new MyCollection( [ { attr1: 'value1', attr2: 'value2' } ] );
				
				var optionsObj = { raw: true };
				var result = collection.getData( optionsObj );  // even though there really is no result from this unit test with a mock object, this has the side effect of populating the test data
				
				// Check that the correct arguments were provided to the NativeObjectConverter's convert() method
				//expect( .args[ 0 ] ).toBe( collection );  // orig YUI Test err msg: "The first arg provided to NativeObjectConverter::convert() should have been the collection."
				//expect( .args[ 1 ] ).toBe( optionsObj );  // orig YUI Test err msg: "The second arg provided to NativeObjectConverter::convert() should have been the options object"
			} );
			
		} );
		
		
		describe( "Test getCount()", function() {
			
			it( "getCount() should return 0 for a brand new Collection", function() {
				var collection = new Collection();
				
				expect( collection.getCount() ).toBe( 0 );
			} );
			
			
			it( "getCount() should return the number of models inserted at any given time", function() {
				var MyModel = Model.extend( { attributes: [ 'attr' ] } ),
				    model1 = new MyModel( { attr: 1 } ),
				    model2 = new MyModel( { attr: 2 } ),
				    model3 = new MyModel( { attr: 3 } ),
				    collection = new Collection( [ model1, model2 ] );
				
				expect( collection.getCount() ).toBe( 2 );  // orig YUI Test err msg: "initially, the collection should have 2 models"
				
				collection.remove( model1 );
				expect( collection.getCount() ).toBe( 1 );  // orig YUI Test err msg: "After removal of model1, the collection should have 1 model"
				
				collection.add( [ model1, model3 ] );
				expect( collection.getCount() ).toBe( 3 );  // orig YUI Test err msg: "After adding model1 and model3, the collection should have 3 models"
			} );
			
		} );
		
		
		describe( "Test getByClientId()", function() {
			
			it( "getByClientId() should retrieve a model by its clientId", function() {
				var MyModel = Model.extend( {} ),
				    model1 = new MyModel(),
				    model2 = new MyModel();
				
				var collection = new Collection( [ model1, model2 ] );
				
				expect( collection.getByClientId( model1.getClientId() ) ).toBe( model1 );  // orig YUI Test err msg: "model1 should have been able to be retrieved by its clientId"
				expect( collection.getByClientId( model2.getClientId() ) ).toBe( model2 );  // orig YUI Test err msg: "model2 should have been able to be retrieved by its clientId"
			} );
			
			
			it( "getByClientId() should return null if the collection doesn't have the model whose clientId is requested", function() {
				var MyModel = Model.extend( {} ),
				    model = new MyModel();
				
				var collection = new Collection();  // note: not adding model
				
				expect( collection.getByClientId( model.getClientId() ) ).toBe( null );
			} );
			
		} );
		
		
		describe( "Test getById()", function() {
			var MyModel = Model.extend( { attributes: [ 'id' ], idAttribute: 'id' } );
			
			
			it( "getById() should retrieve a model by its id attribute", function() {
				var model1 = new MyModel( { id: 1 } ),
				    model2 = new MyModel( { id: 2 } );
				
				var collection = new Collection( [ model1, model2 ] );
				
				expect( collection.getById( 1 ) ).toBe( model1 );  // orig YUI Test err msg: "model1 should have been able to be retrieved by its id"
				expect( collection.getById( 2 ) ).toBe( model2 );  // orig YUI Test err msg: "model2 should have been able to be retrieved by its id"
			} );
			
			
			it( "getById() should return null for a model id that doesn't exist within its collection", function() {
				var model1 = new MyModel( { id: 1 } ),
				    model2 = new MyModel( { id: 2 } );
				
				var collection = new Collection();
				
				expect( collection.getById( 1 ) ).toBe( null );  // orig YUI Test err msg: "Test with no models in the collection at all"
				
				collection.add( model1 );
				expect( collection.getById( 2 ) ).toBe( null );  // orig YUI Test err msg: "Test with a model in the collection"
				
				expect( collection.getById( 1 ) ).toBe( model1 );  // orig YUI Test err msg: "Sanity check, model1 should be able to be retrieved by its id at this point"
			} );
			
			
			it( "getById() should retreive a model by its id attribute, even if it doesn't yet have an id when it is added to the collection (the id is added later)", function() {
				var model = new MyModel(),  // no id yet
				    collection = new Collection( [ model ] );  // add the model
				
				// Now change the model's id
				model.set( 'id', 1 );
				
				expect( collection.getById( 1 ) ).toBe( model );
			} );
			
		} );
		
		
		describe( "Test has()", function() {
			
			it( "has() should return true if a model has been added to the collection, and false if a model has not been added to the collection", function() {
				var MyModel = Model.extend( { attributes: [ 'attr' ] } );
				
				var model1 = new MyModel(),
				    model2 = new MyModel(),
				    collection = new Collection();
				
				expect( collection.has( model1 ) ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not have model1"
				expect( collection.has( model2 ) ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not have model2"
				
				collection.add( model1 );
				expect( collection.has( model1 ) ).toBe( true );  // orig YUI Test err msg: "The collection should now have model1"
				
				expect( collection.has( model2 ) ).toBe( false );  // orig YUI Test err msg: "The collection should still not have model2, as it has not been added"
				
				
				// Now remove model1, and test again
				collection.remove( model1 );
				expect( collection.has( model1 ) ).toBe( false );  // orig YUI Test err msg: "The collection should not have model1 anymore, as it has been removed"
			} );
			
		} );
		
		
		describe( "Test indexOf()", function() {
			
			it( "indexOf() should return the index of a model in the collection", function() {
				var MyModel = Model.extend( { attributes: [ 'attr' ] } ),
				    model1 = new MyModel(),
				    model2 = new MyModel(),
				    collection = new Collection( [ model1, model2 ] );
				
				expect( collection.indexOf( model1 ) ).toBe( 0 );  // orig YUI Test err msg: "model1 should be at index 0"
				expect( collection.indexOf( model2 ) ).toBe( 1 );  // orig YUI Test err msg: "model2 should be at index 1"
			} );
			
			
			it( "indexOf() should return -1 for a model that does not exist within the collection", function() {
				var MyModel = Model.extend( { attributes: [ 'attr' ] } ),
				    model1 = new MyModel(),
				    model2 = new MyModel(),
				    collection = new Collection( [ model1 ] );  // not adding model2
				
				expect( collection.indexOf( model2 ) ).toBe( -1 );  // orig YUI Test err msg: "model2 is not in the collection, so indexOf() should return -1"
			} );
			
		} );
		
		
		describe( "Test indexOfId()", function() {
			
			it( "indexOfId() should return the index of a model by its id in the collection", function() {
				var MyModel = Model.extend( { attributes: [ 'id' ], idAttribute: 'id' } ),
				    model1 = new MyModel( { id: 1 } ),
				    model2 = new MyModel( { id: 2 } ),
				    collection = new Collection( [ model1, model2 ] );
				
				expect( collection.indexOfId( 1 ) ).toBe( 0 );  // orig YUI Test err msg: "model1 should be at index 0"
				expect( collection.indexOfId( 2 ) ).toBe( 1 );  // orig YUI Test err msg: "model2 should be at index 1"
			} );
			
			
			it( "indexOfId() should return -1 for a model by its id that does not exist within the collection", function() {
				var MyModel = Model.extend( { attributes: [ 'id' ], idAttribute: 'id' } ),
				    model1 = new MyModel( { id: 1 } ),
				    model2 = new MyModel( { id: 2 } ),
				    collection = new Collection( [ model1 ] );  // not adding model2
				
				expect( collection.indexOfId( 2 ) ).toBe( -1 );  // orig YUI Test err msg: "model2 is not in the collection, so indexOfId() should return -1"
			} );
			
		} );
		
		
		describe( "Test isModified()", function() {
			var thisSuite,
			    MyCollection;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.unmodifiedModel1 = JsMockito.mock( Model );
				JsMockito.when( thisSuite.unmodifiedModel1 ).getClientId().thenReturn( 1 );
				JsMockito.when( thisSuite.unmodifiedModel1 ).isModified().thenReturn( false );
				
				thisSuite.unmodifiedModel2 = JsMockito.mock( Model );
				JsMockito.when( thisSuite.unmodifiedModel2 ).getClientId().thenReturn( 2 );
				JsMockito.when( thisSuite.unmodifiedModel2 ).isModified().thenReturn( false );
				
				thisSuite.modifiedModel1 = JsMockito.mock( Model );
				JsMockito.when( thisSuite.modifiedModel1 ).getClientId().thenReturn( 3 );
				JsMockito.when( thisSuite.modifiedModel1 ).isModified().thenReturn( true );
				
				thisSuite.modifiedModel2 = JsMockito.mock( Model );
				JsMockito.when( thisSuite.modifiedModel2 ).getClientId().thenReturn( 4 );
				JsMockito.when( thisSuite.modifiedModel2 ).isModified().thenReturn( true );
								
				MyCollection = Collection.extend( {} );
			} );
			
			
			it( "isModified() should return false if no Models within the collection have been modified", function() {
				var collection = new MyCollection( [ thisSuite.unmodifiedModel1 ] );
				
				expect( collection.isModified() ).toBe( false );
			} );
			
			
			it( "isModified() should return true if a Model within the collection has been modified", function() {
				var collection = new MyCollection( [ thisSuite.unmodifiedModel1, thisSuite.modifiedModel1 ] );
				
				expect( collection.isModified() ).toBe( true );
			} );
			
			
			it( "isModified() should return true if a model has been added to the Collection since the last commit/rollback", function() {
				var collection = new MyCollection();
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				
				collection.add( thisSuite.unmodifiedModel1 );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be modified, since a Model was added."
			} );
			
			
			it( "isModified() should return true if a model has been removed from the Collection since the last commit/rollback", function() {
				var collection = new MyCollection( [ thisSuite.unmodifiedModel1, thisSuite.unmodifiedModel2 ] );
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				
				collection.remove( thisSuite.unmodifiedModel1 );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be modified, since a Model was removed."
			} );
			
			
			it( "isModified() should return true if a model has been reordered in the Collection since the last commit/rollback", function() {
				var collection = new MyCollection( [ thisSuite.unmodifiedModel1, thisSuite.unmodifiedModel2 ] );
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				
				collection.add( thisSuite.unmodifiedModel1, { at: 1 } );  // move unmodifiedmodel1 to the 2nd position
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be modified, since a Model was reordered."
			} );
			
			
			it( "isModified() should return false when there is a change, but commit()/rollback() has been called", function() {
				var collection = new MyCollection();
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				
				// Add but then commit()
				collection.add( thisSuite.unmodifiedModel1 );
				collection.commit();
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered modified, since a Model was added, and then committed."
				
				// Add but then rollback()
				collection.add( thisSuite.unmodifiedModel2 );
				collection.rollback();
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered modified, since a Model was added, and then rolled back."
			} );
			
		} );
		
		
		describe( "Test find()", function() {
			var MyModel = Model.extend( {
				attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "find() should find a Model by attribute and value", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new MyCollection( [ model1, model2 ] ),
				    foundModel;
				
				foundModel = collection.find( 'boolAttr', false );
				expect( foundModel ).toBe( model1 );  // orig YUI Test err msg: "did not find model by boolean false"
				
				foundModel = collection.find( 'boolAttr', true );
				expect( foundModel ).toBe( model2 );  // orig YUI Test err msg: "did not find model by boolean true"
				
				foundModel = collection.find( 'numberAttr', 0 );
				expect( foundModel ).toBe( model1 );  // orig YUI Test err msg: "did not find model by number 0"
				
				foundModel = collection.find( 'numberAttr', 1 );
				expect( foundModel ).toBe( model2 );  // orig YUI Test err msg: "did not find model by number 1"
				
				foundModel = collection.find( 'stringAttr', "" );
				expect( foundModel ).toBe( model1 );  // orig YUI Test err msg: "did not find model by empty string"
				
				foundModel = collection.find( 'stringAttr', "value" );
				expect( foundModel ).toBe( model2 );  // orig YUI Test err msg: "did not find model by string value"
				
				// Try finding a model by a value that doesn't exist
				foundModel = collection.find( 'stringAttr', "ooglyBoogly" );
				expect( foundModel ).toBe( null );  // orig YUI Test err msg: "Finding a model by an attribute that doesn't exist should return null"
			} );
			
			
			it( "find() should start at a given startIndex when provided", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new MyModel( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } );
				    
				var collection = new MyCollection( [ model1, model2, model3 ] ),
				    foundModel;
				
				// Start at index 1 (position 2), which should match model3 instead of model1
				foundModel = collection.find( 'boolAttr', false, { startIndex: 1 } );
				expect( foundModel ).toBe( model3 );  // orig YUI Test err msg: "The model that was found should have been model3, because it is the only one that matched the criteria past the given startIndex"
			} );
			
		} );
		
		
		describe( "Test findBy()", function() {
			var MyModel = Model.extend( {
				attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
			} );
			
			var MyCollection = Collection.extend( {
				model : MyModel
			} );
			
			
			it( "findBy should accept a function that when it returns true, it considers the Model the match", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new MyModel( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } );
				    
				var collection = new MyCollection( [ model1, model2, model3 ] ),
				    foundModel;
				
				foundModel = collection.findBy( function( model, index ) {
					if( model.get( 'boolAttr' ) === true ) {
						return true;
					}
				} );
				expect( foundModel ).toBe( model2 );
			} );
			
			
			it( "findBy should return null when there is no match", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new MyModel( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } );
				    
				var collection = new MyCollection( [ model1, model2, model3 ] ),
				    foundModel;
				
				foundModel = collection.findBy( function( model, index ) {
					// Simulate no match with an empty function that never returns `true`
				} );
				expect( foundModel ).toBe( null );
			} );
			
			
			it( "findBy should start at the given startIndex", function() {
				var model1 = new MyModel( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new MyModel( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new MyModel( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } );
				    
				var collection = new MyCollection( [ model1, model2, model3 ] ),
				    foundModel;
				
				foundModel = collection.findBy( function( model, index ) {
					if( model.get( 'boolAttr' ) === false ) {
						return true;
					}
				}, { startIndex: 1 } );
				expect( foundModel ).toBe( model3 );
			} );
			
		} );
		
		
		// -----------------------------------
		
		
		describe( 'getProxy()', function() {
			
			it( "should instantiate the correct Proxy subclass if it is an anonymous config object", function() {
				var collection = new Collection( {
					proxy : {
						type : 'ajax'
					}
				} );
				
				expect( collection.getProxy() instanceof AjaxProxy ).toBe( true );
			} );
			
			
			it( "should simply return the `proxy` if it is already a Proxy instance", function() {
				var proxy = new AjaxProxy();
				var collection = new Collection( {
					proxy : proxy
				} );
				
				expect( collection.getProxy() ).toBe( proxy );
			} );
			
		} );
		
		
		
		// Test the 4 "load" methods
		
		describe( 'load()', function() {
			var loadTestCreator = new LoadTestCreator();
			loadTestCreator.createTests();
		} );
		
		describe( 'loadRange()', function() {
			var loadRangeTestCreator = new LoadRangeTestCreator();
			loadRangeTestCreator.createTests();
		} );
		
		describe( 'loadPage()', function() {
			var loadPageTestCreator = new LoadPageTestCreator();
			loadPageTestCreator.createTests();
		} );
		
		describe( 'loadPageRange()', function() {
			var loadPageRangeTestCreator = new LoadPageRangeTestCreator();
			loadPageRangeTestCreator.createTests();
		} );
		
		
		
		describe( "Test sync()", function() {
			
			function createModels( howMany ) {
				var models = [],
				    ConcreteAttribute = Attribute.extend( { constructor: function(){} } );
				
				for( var i = 0; i < howMany; i++ ) {
					var model = JsMockito.mock( Model ),
					    idAttribute = JsMockito.mock( ConcreteAttribute );
					
					JsMockito.when( idAttribute ).getName().thenReturn( 'attribute_' + i );
					JsMockito.when( model ).getIdAttribute().thenReturn( idAttribute );
					JsMockito.when( model ).hasIdAttribute().thenReturn( true );
					JsMockito.when( model ).getId().thenReturn( i );
					JsMockito.when( model ).getClientId().thenReturn( 'c_' + i );
					JsMockito.when( model ).isNew().thenReturn( false );
					JsMockito.when( model ).isModified().thenReturn( false );
					
					models.push( model );
				}
				
				return models;
			}
			
			
			it( "should create (save) models that are new", function() {
				var models = createModels( 2 );
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				
				var collection = new Collection( models );
				collection.sync();
				
				JsMockito.verify( models[ 0 ] ).save();
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();
				
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();
			} );
			
			
			it( "should save models that have been modified", function() {
				var models = createModels( 2 );
				JsMockito.when( models[ 0 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				
				var collection = new Collection( models );
				collection.sync();
				
				JsMockito.verify( models[ 0 ] ).save();
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();
				
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();
			} );
			
			
			it( "should destroy models that have been removed from the collection", function() {
				var models = createModels( 2 );
				JsMockito.when( models[ 0 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				
				var collection = new Collection( models );
				collection.remove( models[ 0 ] );
				collection.sync();
				
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 0 ] ).destroy();
				
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();
			} );
			
			
			it( "should destroy models that have been removed from the collection in more than one call to remove() (to make sure the 'removedModels' is cumulative)", function() {
				var models = createModels( 2 );
				JsMockito.when( models[ 0 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				JsMockito.when( models[ 1 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 1 ] ); } );
				
				var collection = new Collection( models );
				collection.remove( models[ 0 ] );
				collection.remove( models[ 1 ] );
				collection.sync();
				
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 0 ] ).destroy();
				
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 1 ] ).destroy();
			} );
			
			
			it( "should destroy models that have been removed from the collection, but if one fails, only that one should be attempted to be destroyed again upon the next sync()", function() {
				var models = createModels( 2 );
				JsMockito.when( models[ 0 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				JsMockito.when( models[ 1 ] ).destroy().then( 
					function() { return (new jQuery.Deferred()).reject( models[ 1 ] ); },   // destroy() errors out the first time, 
					function() { return (new jQuery.Deferred()).resolve( models[ 1 ] ); }   // and then is successful the second time
				);
				
				var collection = new Collection( models );
				collection.remove( models[ 0 ] );
				collection.remove( models[ 1 ] );
				collection.sync();  // for this call, models[ 0 ] was the only one that was destroyed
				collection.sync();  // this call should attempt to destroy models[ 1 ] again, since it was not successfully destroyed from the first one
				
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.once() ).destroy();      // This model should have only been destroyed once, since it was successfully destroyed during the first call to sync()
				
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.times( 2 ) ).destroy();  // This model should have been attempted to be destroyed a total of 2 times, since it failed to be destroyed the first time
			} );
			
			
			it( "should destroy models that have been removed from the collection only on the first call to sync(). They should not be destroyed again afterwards.", function() {
				var models = createModels( 2 );
				JsMockito.when( models[ 0 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				JsMockito.when( models[ 1 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 1 ] ); } );
				
				var collection = new Collection( models );
				collection.remove( models[ 0 ] );
				collection.remove( models[ 1 ] );
				collection.sync();
				collection.sync();  // call it again, to make sure the models are only destroyed once
				
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.once() ).destroy();   // using explicit once() verifier (even though that's the default) just to be clear
				
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.once() ).destroy();   // using explicit once() verifier (even though that's the default) just to be clear
			} );
			
			
			it( "should save models that are new and modified, and destroy models that have been removed.", function() {
				var models = createModels( 4 );
				
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				
				JsMockito.when( models[ 1 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 1 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 1 ] ); } );
				
				// Note: models[ 2 ] is not new/modified
				
				// Note: models[ 3 ] will be removed
				JsMockito.when( models[ 3 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 3 ] ); } );
				
				var collection = new Collection( models );
				collection.remove( models[ 3 ] );
				collection.sync();
				
				JsMockito.verify( models[ 0 ] ).save();
				JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();
				
				JsMockito.verify( models[ 1 ] ).save();
				JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();
				
				JsMockito.verify( models[ 2 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 2 ], JsMockito.Verifiers.never() ).destroy();
				
				JsMockito.verify( models[ 3 ], JsMockito.Verifiers.never() ).save();
				JsMockito.verify( models[ 3 ] ).destroy();
			} );
			
			
			it( "should call the 'success' and 'complete' callbacks when no persistence requests need to be done on any of the Collection's models", function() {
				var models = createModels( 4 );
				var collection = new Collection( models );
				
				var successCount = 0,
				    errorCount = 0,
				    completeCount = 0;
				
				collection.sync( {
					success  : function() { successCount++; },
					error    : function() { errorCount++; },
					complete : function() { completeCount++; }
				} );
				
				expect( successCount ).toBe( 1 );  // orig YUI Test err msg: "The success callback should have been called exactly once"
				expect( errorCount ).toBe( 0 );  // orig YUI Test err msg: "The error callback should not have been called"
				expect( completeCount ).toBe( 1 );  // orig YUI Test err msg: "The complete callback should have been called exactly once"
			} );
			
			
			it( "should call the 'success' and 'complete' callbacks if all persistence requests succeed", function() {
				var models = createModels( 4 );
				
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				
				JsMockito.when( models[ 1 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 1 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 1 ] ); } );
				
				// Note: models[ 2 ] is not new/modified
				
				// Note: models[ 3 ] will be removed
				JsMockito.when( models[ 3 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 3 ] ); } );
				
				
				var collection = new Collection( models );
				collection.remove( models[ 3 ] );
				
				
				var successCount = 0,
				    errorCount = 0,
				    completeCount = 0;
				
				collection.sync( {
					success  : function() { successCount++; },
					error    : function() { errorCount++; },
					complete : function() { completeCount++; }
				} );
				
				expect( successCount ).toBe( 1 );  // orig YUI Test err msg: "The success callback should have been called exactly once"
				expect( errorCount ).toBe( 0 );  // orig YUI Test err msg: "The error callback should not have been called"
				expect( completeCount ).toBe( 1 );  // orig YUI Test err msg: "The complete callback should have been called exactly once"
			} );
			
			
			it( "should call the 'error' and 'complete' callbacks if all persistence requests fail", function() {
				var models = createModels( 4 );
				
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).reject( models[ 0 ] ); } );
				
				JsMockito.when( models[ 1 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 1 ] ).save().then( function() { return (new jQuery.Deferred()).reject( models[ 1 ] ); } );
				
				// Note: models[ 2 ] is not new/modified
				
				// Note: models[ 3 ] will be removed
				JsMockito.when( models[ 3 ] ).destroy().then( function() { return (new jQuery.Deferred()).reject( models[ 3 ] ); } );
				
				
				var collection = new Collection( models );
				collection.remove( models[ 3 ] );
				
				
				var successCount = 0,
				    errorCount = 0,
				    completeCount = 0;
				
				collection.sync( {
					success  : function() { successCount++; },
					error    : function() { errorCount++; },
					complete : function() { completeCount++; }
				} );
				
				expect( successCount ).toBe( 0 );  // orig YUI Test err msg: "The success callback should not have been called"
				expect( errorCount ).toBe( 1 );  // orig YUI Test err msg: "The error callback should have been called exactly once"
				expect( completeCount ).toBe( 1 );  // orig YUI Test err msg: "The complete callback should have been called exactly once"
			} );
			
			
			it( "should call the 'error' and 'complete' callbacks if just one of the persistence requests fail (in this case, the first persistence request)", function() {
				var models = createModels( 4 );
				
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).reject( models[ 0 ] ); } );
				
				JsMockito.when( models[ 1 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 1 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 3 ] ); } );
				
				// Note: models[ 2 ] is not new/modified
				
				// Note: models[ 3 ] will be removed
				JsMockito.when( models[ 3 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 3 ] ); } );
				
				
				var collection = new Collection( models );
				collection.remove( models[ 3 ] );
				
				
				var successCount = 0,
				    errorCount = 0,
				    completeCount = 0;
				
				collection.sync( {
					success  : function() { successCount++; },
					error    : function() { errorCount++; },
					complete : function() { completeCount++; }
				} );
				
				expect( successCount ).toBe( 0 );  // orig YUI Test err msg: "The success callback should not have been called"
				expect( errorCount ).toBe( 1 );  // orig YUI Test err msg: "The error callback should have been called exactly once"
				expect( completeCount ).toBe( 1 );  // orig YUI Test err msg: "The complete callback should have been called exactly once"
			} );
			
			
			it( "should call the 'error' and 'complete' callbacks if just one of the persistence requests fail (in this case, a middle persistence request)", function() {
				var models = createModels( 4 );
				
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); });
				
				JsMockito.when( models[ 1 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 1 ] ).save().then( function() { return (new jQuery.Deferred()).reject( models[ 1 ] ); } );
				
				// Note: models[ 2 ] is not new/modified
				
				// Note: models[ 3 ] will be removed
				JsMockito.when( models[ 3 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 3 ] ); } );
				
				
				var collection = new Collection( models );
				collection.remove( models[ 3 ] );
				
				
				var successCount = 0,
				    errorCount = 0,
				    completeCount = 0;
				
				collection.sync( {
					success  : function() { successCount++; },
					error    : function() { errorCount++; },
					complete : function() { completeCount++; }
				} );
				
				expect( successCount ).toBe( 0 );  // orig YUI Test err msg: "The success callback should not have been called"
				expect( errorCount ).toBe( 1 );  // orig YUI Test err msg: "The error callback should have been called exactly once"
				expect( completeCount ).toBe( 1 );  // orig YUI Test err msg: "The complete callback should have been called exactly once"
			} );
			
			
			it( "should call the 'error' and 'complete' callbacks if just one of the persistence requests fail (in this case, the last persistence request)", function() {
				var models = createModels( 4 );
				
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				
				JsMockito.when( models[ 1 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 1 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 1 ] ); } );
				
				// Note: models[ 2 ] is not new/modified
				
				// Note: models[ 3 ] will be removed
				JsMockito.when( models[ 3 ] ).destroy().then( function() { return (new jQuery.Deferred()).reject( models[ 3 ] ); } );
				
				
				var collection = new Collection( models );
				collection.remove( models[ 3 ] );
				
				
				var successCount = 0,
				    errorCount = 0,
				    completeCount = 0;
				
				collection.sync( {
					success  : function() { successCount++; },
					error    : function() { errorCount++; },
					complete : function() { completeCount++; }
				} );
				
				expect( successCount ).toBe( 0 );  // orig YUI Test err msg: "The success callback should not have been called"
				expect( errorCount ).toBe( 1 );  // orig YUI Test err msg: "The error callback should have been called exactly once"
				expect( completeCount ).toBe( 1 );  // orig YUI Test err msg: "The complete callback should have been called exactly once"
			} );
			
			
			it( "should return a jQuery.Promise object which has its `done` and `always` callbacks executed when no models in the Collection need to be persisted", function() {
				var models = createModels( 4 );				
				var collection = new Collection( models );
				
				var doneCount = 0,
				    failCount = 0,
				    alwaysCount = 0;
				
				var promise = collection.sync()
					.done( function() { doneCount++; } )
					.fail( function() { failCount++; } )
					.always( function() { alwaysCount++; } );
				
				expect( doneCount ).toBe( 1 );  // orig YUI Test err msg: "The `done` callback should have been called exactly once"
				expect( failCount ).toBe( 0 );  // orig YUI Test err msg: "The `fail` callback should not have been called"
				expect( alwaysCount ).toBe( 1 );  // orig YUI Test err msg: "The `always` callback should have been called exactly once"
			} );
			
			
			it( "should return a jQuery.Promise object which has its `done` and `always` callbacks executed when the sync of Models in the Collection succeeds", function() {
				var models = createModels( 4 );
				
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				
				JsMockito.when( models[ 1 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 1 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 1 ] ); } );
				
				// Note: models[ 2 ] is not new/modified
				
				// Note: models[ 3 ] will be removed
				JsMockito.when( models[ 3 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 3 ] ); } );
				
				
				var collection = new Collection( models );
				collection.remove( models[ 3 ] );
				
				
				var doneCount = 0,
				    failCount = 0,
				    alwaysCount = 0;
				
				var promise = collection.sync()
					.done( function() { doneCount++; } )
					.fail( function() { failCount++; } )
					.always( function() { alwaysCount++; } );
				
				expect( doneCount ).toBe( 1 );  // orig YUI Test err msg: "The `done` callback should have been called exactly once"
				expect( failCount ).toBe( 0 );  // orig YUI Test err msg: "The `fail` callback should not have been called"
				expect( alwaysCount ).toBe( 1 );  // orig YUI Test err msg: "The `always` callback should have been called exactly once"
			} );
			
			
			it( "should return a jQuery.Promise object which has its `fail` and `always` callbacks executed when at least one of the requests of the sync fails", function() {
				var models = createModels( 4 );
				
				JsMockito.when( models[ 0 ] ).isNew().thenReturn( true );
				JsMockito.when( models[ 0 ] ).save().then( function() { return (new jQuery.Deferred()).resolve( models[ 0 ] ); } );
				
				JsMockito.when( models[ 1 ] ).isModified().thenReturn( true );
				JsMockito.when( models[ 1 ] ).save().then( function() { return (new jQuery.Deferred()).reject( models[ 1 ] ); } );
				
				// Note: models[ 2 ] is not new/modified
				
				// Note: models[ 3 ] will be removed
				JsMockito.when( models[ 3 ] ).destroy().then( function() { return (new jQuery.Deferred()).resolve( models[ 3 ] ); } );
				
				
				var collection = new Collection( models );
				collection.remove( models[ 3 ] );
				
				
				var doneCount = 0,
				    failCount = 0,
				    alwaysCount = 0;
				
				var promise = collection.sync()
					.done( function() { doneCount++; } )
					.fail( function() { failCount++; } )
					.always( function() { alwaysCount++; } );
				
				expect( doneCount ).toBe( 0 );  // orig YUI Test err msg: "The `done` callback should not have been called"
				expect( failCount ).toBe( 1 );  // orig YUI Test err msg: "The `fail` callback should have been called exactly once"
				expect( alwaysCount ).toBe( 1 );  // orig YUI Test err msg: "The `always` callback should have been called exactly once"
			} );
			
		} );
		
	} );
} );