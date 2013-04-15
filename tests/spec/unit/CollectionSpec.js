/*global define, window, _, describe, beforeEach, afterEach, it, xit, expect, JsMockito */
define( [
	'jquery',
	'data/Data',
	'data/Collection',
	'data/Model',
	'data/attribute/Attribute',
	'data/persistence/ResultSet',
	'data/persistence/proxy/Proxy',
	'data/persistence/proxy/Ajax',
	'data/persistence/operation/Read',
	'data/persistence/operation/Batch'
], function( jQuery, Data, Collection, Model, Attribute, ResultSet, Proxy, AjaxProxy, ReadOperation, BatchOperation ) {
	describe( "unit.data.Collection", function() {
		
		describe( "Test the constructor", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'attr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "The constructor should accept a configuration object to initialize the Collection with an initial set of data/models and any other custom configs", function() {
				var model = new thisSuite.Model( { attr: 'value1' } );
				
				var collection = new thisSuite.Collection( {
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
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    collection = new thisSuite.Collection( [ model1, model2 ] );
				
				var models = collection.getModels();
				expect( models.length ).toBe( 2 );  // orig YUI Test err msg: "There should now be two models in the collection"
				expect( models[ 0 ] ).toBe( model1 );  // orig YUI Test err msg: "The first model should be the first model provided to the constructor"
				expect( models[ 1 ] ).toBe( model2 );  // orig YUI Test err msg: "The second model should be the second model provided to the constructor"
			} );
			
			
			it( "The constructor should attach listeners provided by the `listeners` config", function() {
				var addCallCount = 0;  // used for testing if the event was fired
				
				var collection = new thisSuite.Collection( {
					listeners : {
						'add' : function() {
							addCallCount++;
						}
					}
				} );
				
				collection.fireEvent( 'add' );
				expect( addCallCount ).toBe( 1 );  // orig YUI Test err msg: "The 'add' event should have been fired, and the handler attached via config should have been called"
			} );
			
			
			it( "The constructor should not call the load() method if `autoLoad` is false", function() {
				var loadCallCount = 0;
				var MyCollection = thisSuite.Collection.extend( {
					load : function() {  // redefine load() method
						loadCallCount++;
					}
				} );
				
				var collection = new MyCollection( {
					autoLoad : false
				} );
				expect( loadCallCount ).toBe( 0 );  // orig YUI Test err msg: "load() shouldn't have been called"
			} );
			
			
			it( "The constructor should call the load() method immediately if `autoLoad` is true, and no initial `data` config is specified", function() {
				var loadCallCount = 0;
				var MyCollection = thisSuite.Collection.extend( {
					load : function() {  // redefine load() method
						loadCallCount++;
					}
				} );
				
				var collection = new MyCollection( {
					autoLoad : true
				} );
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "load() should have been called"
			} );
			
			
			it( "The constructor should *not* call the load() method if `autoLoad` is true, but an initial `data` config has been specified", function() {
				var loadCallCount = 0;
				var MyCollection = thisSuite.Collection.extend( {
					load : function() {  // redefine load() method
						loadCallCount++;
					}
				} );
				
				var collection = new MyCollection( {
					autoLoad : true,
					data : [ 
						new thisSuite.Model( { attr: 1 } )
					]
				} );
				expect( loadCallCount ).toBe( 0 );  // orig YUI Test err msg: "load() shouldn't have been called"
			} );
			
		} );
		
		
		describe( "Test createModel()", function() {
			
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
		
		
		describe( "Test add()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'attr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "add() should be able to add a single Model instance to the Collection", function() {
				var collection = new thisSuite.Collection(),
				    model = new thisSuite.Model( { attr: 'value' } ),
				    models;
				
				models = collection.getModels();
				expect( models.length ).toBe( 0 );  // orig YUI Test err msg: "Initial condition: There should be no models in the collection"
				
				collection.add( model );
				
				models = collection.getModels();
				expect( models.length ).toBe( 1 );  // orig YUI Test err msg: "There should now be one model in the collection"
				expect( models[ 0 ] ).toBe( model );  // orig YUI Test err msg: "The model added should be the first model in the collection"
			} );
			
			
			it( "add() should be able to add an array of Model instances to the Collection", function() {
				var collection = new thisSuite.Collection(),
				    model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
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
				var collection = new thisSuite.Collection(),
				    model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    models;
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be modified"
				
				collection.add( model1 );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be considered modified"
			} );
			
			
			it( "add() should be able to add a single Model instance to the Collection at a specified index", function() {
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    model3 = new thisSuite.Model( { attr: 'value3' } ),
				    collection = new thisSuite.Collection( [ model1, model2 ] ), // only inserting model1 and model2 for now
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
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    model3 = new thisSuite.Model( { attr: 'value3' } ),
				    model4 = new thisSuite.Model( { attr: 'value4' } ),
				    collection = new thisSuite.Collection( [ model1, model2 ] ), // only inserting model1 and model2 for now
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
				var collection = new thisSuite.Collection(),
				    model = new thisSuite.Model( { attr: 'value' } ),
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
				var collection = new thisSuite.Collection(),
				    model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
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
				var model = new thisSuite.Model( { attr: 'value1' } ),
				    collection = new thisSuite.Collection( [ model ] );  // initally add the model
				
				var addEventFired = false;
				collection.on( 'add', function( collection, model ) {
					addEventFired = true;
				} );
				collection.add( model );
				
				expect( addEventFired ).toBe( false );  // orig YUI Test err msg: "The 'add' event should not have been fired for another insert of the same model"
			} );
			
			
			it( "add() should *not* fire the 'add' event for models that are already in the Collection when multiple models are inserted, and only some exist already", function() {
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    collection = new thisSuite.Collection( [ model1 ] );  // initally add model1
				
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
				var collection = new thisSuite.Collection(),
				    model = new thisSuite.Model( { attr: 'value' } ),
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
				var collection = new thisSuite.Collection(),
				    model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
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
				var model = new thisSuite.Model( { attr: 'value1' } ),
				    collection = new thisSuite.Collection( [ model ] );  // initally add the model
				
				var addEventFired = false;
				collection.on( 'addset', function( collection, models ) {
					addEventFired = true;
				} );
				collection.add( model );
				
				expect( addEventFired ).toBe( false );  // orig YUI Test err msg: "The 'addset' event should not have been fired for another insert of the same model"
			} );
			
			
			it( "add() should *not* fire the 'addset' event for models that are already in the Collection when multiple models are inserted, and only some exist already", function() {
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    collection = new thisSuite.Collection( [ model1 ] );  // initally add model1
				
				var addedModels;
				collection.on( 'addset', function( collection, models ) {
					addedModels = models;
				} );
				collection.add( [ model1, model2 ] );  // now insert model1 and model2. Only model2 should really have been "added"
				
				expect( addedModels ).toEqual( [ model2 ] );  // orig YUI Test err msg: "The 'addset' event should have only fired with the model that was actually added"
			} );
			
			
			it( "add() should reorder models when they already exist in the Collection", function() {
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    model3 = new thisSuite.Model( { attr: 'value3' } ),
				    collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
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
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    model3 = new thisSuite.Model( { attr: 'value3' } ),
				    collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
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
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    model3 = new thisSuite.Model( { attr: 'value3' } ),
				    collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
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
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    model3 = new thisSuite.Model( { attr: 'value3' } ),
				    collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
				    models;
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not yet be considered 'modified'"
				
				collection.add( model3, { at: 1 } );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be considered modified, since there has been a reorder"
			} );
			
			
			it( "add() should *not* reorder models when calling add() without the `index` argument (which would be the case as well if add() was called)", function() {
				var model1 = new thisSuite.Model( { attr: 'value1' } ),
				    model2 = new thisSuite.Model( { attr: 'value2' } ),
				    model3 = new thisSuite.Model( { attr: 'value3' } ),
				    collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
				    models;
				
				collection.add( model1 );  // supposed append, but model1 is already in the Collection, and an index was not given
				expect( collection.getModels() ).toEqual( [ model1, model2, model3 ] );  // orig YUI Test err msg: "The models should be in the original order, as the supposed 'append' should not have happened because the model was already in the collection, and no new index was given"
			} );
			
			
			it( "add() should transform anonymous data objects to Model instances, based on the 'model' config", function() {
				var collection = new thisSuite.Collection(),  // note: thisSuite.Collection is configured with thisSuite.Model as the 'model'
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
			
			
			it( "add() should fire the 'addset' event with instantiated models for any anonymous config objects", function() {
				var collection = new thisSuite.Collection(),  // note: thisSuite.Collection is configured with thisSuite.Model as the 'model'
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
				var model = new thisSuite.Model(),
				    collection = new thisSuite.Collection();
				
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
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "remove() should be able to remove a single Model from the Collection", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new thisSuite.Model( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } ),
				    model4 = new thisSuite.Model( { boolAttr: true, numberAttr: 3, stringAttr: "value3" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3, model4 ] ),
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
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new thisSuite.Model( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } ),
				    model4 = new thisSuite.Model( { boolAttr: true, numberAttr: 3, stringAttr: "value3" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3, model4 ] ),
				    models;
				
				// Test initial condition
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model2, model3, model4 ] );  // orig YUI Test err msg: "Initial condition: the Collection should have 4 models"
				
				collection.remove( [ model2, model4 ] );
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model3 ] );  // orig YUI Test err msg: "Only model1 and model3 should remain"
			} );
			
			
			it( "remove() should fire the 'remove' event for a single model that is removed", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				
				var collection = new thisSuite.Collection( [ model1, model2 ] );
				
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
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2 ] );
				
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
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new thisSuite.Collection( [ model1 ] );  // only putting model1 on the collection
				
				var removeEventCalled = false;
				collection.on( 'removeset', function( collection, models ) {
					removeEventCalled = true;
				} );
				
				collection.remove( model2 );  // model2 doesn't exist on the Collection
				expect( removeEventCalled ).toBe( false );  // orig YUI Test err msg: "The 'remove' event should not have been called"
			} );
			
			
			it( "remove() should fire the 'removeset' event with the array of removed models, even if only one model has been removed", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2 ] );
				
				var removedModels;
				collection.on( 'removeset', function( collection, models ) {
					removedModels = models;
				} );
				
				collection.remove( model2 );
				expect( removedModels ).toEqual( [ model2 ] );
			} );
			
			
			it( "remove() should fire the 'removeset' event with the array of removed models when multiple models are removed", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2 ] );
				
				var removedModels;
				collection.on( 'removeset', function( collection, models ) {
					removedModels = models;
				} );
				
				collection.remove( [ model1, model2 ] );
				expect( removedModels ).toEqual( [ model1, model2 ] );
			} );
			
			
			it( "remove() should *not* fire the 'removeset' event if no models are actually removed", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new thisSuite.Collection( [ model1 ] );
				
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
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes  : [ 'id' ],
					idAttribute : 'id'
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "removeAll() should be able to remove all Models from the Collection", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    model3 = new thisSuite.Model(),
				    model4 = new thisSuite.Model();
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3, model4 ] ),
				    models;
				
				// Test initial condition
				models = collection.getModels();
				expect( models ).toEqual( [ model1, model2, model3, model4 ] );  // orig YUI Test err msg: "Initial condition: the Collection should have 4 models"
				
				collection.removeAll();
				models = collection.getModels();
				expect( models ).toEqual( [] );  // orig YUI Test err msg: "There should be no models left in the collection"
			} );
			
			
			it( "removeAll() should fire the 'remove' event for each of the removed models", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    model3 = new thisSuite.Model(),
				    model4 = new thisSuite.Model();
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3, model4 ] );
				
				var removedModels = [];
				collection.on( 'remove', function( collection, model ) {
					removedModels.push( model );
				} );
				
				collection.removeAll();
				expect( removedModels ).toEqual( [ model1, model2, model3, model4 ] );
			} );
			
			
			it( "removeAll() should fire the 'removeset' event with the array of removed models when multiple models are removed", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    model3 = new thisSuite.Model(),
				    model4 = new thisSuite.Model();
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3, model4 ] );
				
				var removedModels;
				collection.on( 'removeset', function( collection, models ) {
					removedModels = models;
				} );
				
				collection.removeAll();
				expect( removedModels ).toEqual( [ model1, model2, model3, model4 ] );
			} );
			
			
			it( "removeAll() should *not* fire the 'removeset' event if no models are actually removed", function() {
				var collection = new thisSuite.Collection();  // no models
				
				var removeEventCallCount = 0;
				collection.on( 'removeset', function( collection, models ) {
					removeEventCallCount++;
				} );
				
				collection.removeAll();  // model2 doesn't exist on the Collection
				expect( removeEventCallCount ).toBe( 0 );
			} );
			
			
			it( "removeAll() should clear the `modelsByClientId` and `modelsById` hashmaps", function() {
				var model1 = new thisSuite.Model( { id: 1 } ),
				    model2 = new thisSuite.Model( { id: 2 } );
				var collection = new thisSuite.Collection( [ model1, model2 ] );
				
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
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes: [ 'id' ],
					idAttribute: 'id'
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "getAt() should return the model at a given index", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model();
				    
				var collection = new thisSuite.Collection( [ model1, model2 ] );
				
				expect( collection.getAt( 0 ) ).toBe( model1 );  // orig YUI Test err msg: "model1 should be at index 0"
				expect( collection.getAt( 1 ) ).toBe( model2 );  // orig YUI Test err msg: "model2 should be at index 1"
			} );
			
			
			it( "getAt() should return null for an index that is out of bounds", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model();
				    
				var collection = new thisSuite.Collection( [ model1, model2 ] );
				
				expect( collection.getAt( -1 ) ).toBe( null );  // orig YUI Test err msg: "Should be null for a negative index"
				expect( collection.getAt( 2 ) ).toBe( null );  // orig YUI Test err msg: "Should be null for an index greater than the number of models"
			} );
			
		} );
		
		
		describe( "Test getFirst()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "getFirst() should retrieve the first Model in the Collection", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    collection = new thisSuite.Collection( [ model1, model2 ] );
				    
				expect( collection.getFirst() ).toBe( model1 );
			} );
			
			
			it( "getFirst() should return null if there are no models in the Collection", function() {
				var collection = new thisSuite.Collection();
				
				expect( collection.getFirst() ).toBe( null );
			} );
			
		} );
		
		
		describe( "Test getLast()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "getLast() should retrieve the first Model in the Collection", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    collection = new thisSuite.Collection( [ model1, model2 ] );
				    
				expect( collection.getLast() ).toBe( model2 );
			} );
			
			
			it( "getLast() should return null if there are no models in the Collection", function() {
				var collection = new thisSuite.Collection();
				
				expect( collection.getLast() ).toBe( null );
			} );
			
		} );
		
		
		describe( "Test getRange()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'attr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "getRange() should retrieve all models when no arguments are provided", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    model3 = new thisSuite.Model();
				
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
				    models = collection.getRange();
				
				expect( models ).toEqual( [ model1, model2, model3 ] );
			} );
			
			
			it( "getRange() should retrieve models based on just the startIndex argument, defaulting endIndex to the last model in the Collection", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    model3 = new thisSuite.Model();
				
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
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
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    model3 = new thisSuite.Model();
				
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
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
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'attr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "hasRange() should return true when the Collection has the range of models specified", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    model3 = new thisSuite.Model();
				
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] );
				expect( collection.hasRange( 0, 2 ) ).toBe( true );
			} );
			
			
			it( "hasRange() should return false when the collection does not have the range of models specified", function() {
				var model1 = new thisSuite.Model(),
				    model2 = new thisSuite.Model(),
				    model3 = new thisSuite.Model();
				
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] );
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
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( { attributes: [ 'id' ], idAttribute: 'id' } );
			} );
			
			
			it( "getById() should retrieve a model by its id attribute", function() {
				var model1 = new thisSuite.Model( { id: 1 } ),
				    model2 = new thisSuite.Model( { id: 2 } );
				
				var collection = new Collection( [ model1, model2 ] );
				
				expect( collection.getById( 1 ) ).toBe( model1 );  // orig YUI Test err msg: "model1 should have been able to be retrieved by its id"
				expect( collection.getById( 2 ) ).toBe( model2 );  // orig YUI Test err msg: "model2 should have been able to be retrieved by its id"
			} );
			
			
			it( "getById() should return null for a model id that doesn't exist within its collection", function() {
				var model1 = new thisSuite.Model( { id: 1 } ),
				    model2 = new thisSuite.Model( { id: 2 } );
				
				var collection = new Collection();
				
				expect( collection.getById( 1 ) ).toBe( null );  // orig YUI Test err msg: "Test with no models in the collection at all"
				
				collection.add( model1 );
				expect( collection.getById( 2 ) ).toBe( null );  // orig YUI Test err msg: "Test with a model in the collection"
				
				expect( collection.getById( 1 ) ).toBe( model1 );  // orig YUI Test err msg: "Sanity check, model1 should be able to be retrieved by its id at this point"
			} );
			
			
			it( "getById() should retreive a model by its id attribute, even if it doesn't yet have an id when it is added to the collection (the id is added later)", function() {
				var model = new thisSuite.Model(),  // no id yet
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
			var thisSuite;
			
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
								
				thisSuite.Collection = Collection.extend( {} );
			} );
			
			
			it( "isModified() should return false if no Models within the collection have been modified", function() {
				var collection = new thisSuite.Collection( [ thisSuite.unmodifiedModel1 ] );
				
				expect( collection.isModified() ).toBe( false );
			} );
			
			
			it( "isModified() should return true if a Model within the collection has been modified", function() {
				var collection = new thisSuite.Collection( [ thisSuite.unmodifiedModel1, thisSuite.modifiedModel1 ] );
				
				expect( collection.isModified() ).toBe( true );
			} );
			
			
			it( "isModified() should return true if a model has been added to the Collection since the last commit/rollback", function() {
				var collection = new thisSuite.Collection();
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				
				collection.add( thisSuite.unmodifiedModel1 );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be modified, since a Model was added."
			} );
			
			
			it( "isModified() should return true if a model has been removed from the Collection since the last commit/rollback", function() {
				var collection = new thisSuite.Collection( [ thisSuite.unmodifiedModel1, thisSuite.unmodifiedModel2 ] );
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				
				collection.remove( thisSuite.unmodifiedModel1 );
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be modified, since a Model was removed."
			} );
			
			
			it( "isModified() should return true if a model has been reordered in the Collection since the last commit/rollback", function() {
				var collection = new thisSuite.Collection( [ thisSuite.unmodifiedModel1, thisSuite.unmodifiedModel2 ] );
				
				expect( collection.isModified() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be considered modified"
				
				collection.add( thisSuite.unmodifiedModel1, { at: 1 } );  // move unmodifiedmodel1 to the 2nd position
				expect( collection.isModified() ).toBe( true );  // orig YUI Test err msg: "The collection should now be modified, since a Model was reordered."
			} );
			
			
			it( "isModified() should return false when there is a change, but commit()/rollback() has been called", function() {
				var collection = new thisSuite.Collection();
				
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
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "find() should find a Model by attribute and value", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2 ] ),
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
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new thisSuite.Model( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
				    foundModel;
				
				// Start at index 1 (position 2), which should match model3 instead of model1
				foundModel = collection.find( 'boolAttr', false, { startIndex: 1 } );
				expect( foundModel ).toBe( model3 );  // orig YUI Test err msg: "The model that was found should have been model3, because it is the only one that matched the criteria past the given startIndex"
			} );
			
		} );
		
		
		describe( "Test findBy()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'boolAttr', 'numberAttr', 'stringAttr' ]
				} );
				
				thisSuite.Collection = Collection.extend( {
					model : thisSuite.Model
				} );
			} );
			
			
			it( "findBy should accept a function that when it returns true, it considers the Model the match", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new thisSuite.Model( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
				    foundModel;
				
				foundModel = collection.findBy( function( model, index ) {
					if( model.get( 'boolAttr' ) === true ) {
						return true;
					}
				} );
				expect( foundModel ).toBe( model2 );
			} );
			
			
			it( "findBy should return null when there is no match", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new thisSuite.Model( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
				    foundModel;
				
				foundModel = collection.findBy( function( model, index ) {
					// Simulate no match with an empty function that never returns `true`
				} );
				expect( foundModel ).toBe( null );
			} );
			
			
			it( "findBy should start at the given startIndex", function() {
				var model1 = new thisSuite.Model( { boolAttr: false, numberAttr: 0, stringAttr: "" } ),
				    model2 = new thisSuite.Model( { boolAttr: true, numberAttr: 1, stringAttr: "value" } ),
				    model3 = new thisSuite.Model( { boolAttr: false, numberAttr: 2, stringAttr: "value2" } );
				    
				var collection = new thisSuite.Collection( [ model1, model2, model3 ] ),
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
		
		
		describe( "Test load()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.proxy = JsMockito.mock( Proxy.extend( {
					// Implementation of abstract interface
					create : Data.emptyFn,
					read : Data.emptyFn,
					update : Data.emptyFn,
					destroy : Data.emptyFn
				} ) );
				
				// For the base case for tests. If needing to do something different, override the particular method of interest.
				var deferred = new jQuery.Deferred();
				JsMockito.when( thisSuite.proxy ).create().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).update().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).destroy().then( function( op ) { return deferred.promise(); } );
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'id', 'name' ],
					proxy : thisSuite.proxy
				} );
			} );
			
			
			it( "load() should throw an error if no proxy is configured", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						// note: no proxy, and no model
					} );
					
					new MyCollection().load();
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a proxy configured"
				} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			} );
			
			
			it( "load() should throw an error if it has no proxy but has a Model, but that model has no proxy configured", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						// note: no proxy, and a model that doesn't have a proxy
						model : Model.extend( { /* no proxy on model */ } )
					} );
					
					new MyCollection().load();
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a proxy configured"
				} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			} );
			
			
			it( "load() should delegate to loadPage() when the Collection is configured to use paging (i.e. a `pageSize` config is set)", function() {
				var loadPageCallCount = 0;
				var params = { a : 1 };
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 25,
					
					// Override loadPage, just to see that it's called. loadPage() tests are done elsewhere
					loadPage : function( pageNum, options ) {
						loadPageCallCount++;  // just to make sure that the method is called
						expect( pageNum ).toBe( 1 );  // orig YUI Test err msg: "The pageNum should be 1"
						expect( options.params ).toBe( params );  // orig YUI Test err msg: "The params should have been passed along from the call to load()"
					}
				} );
				
				new MyCollection().load( { params: params } );
				expect( loadPageCallCount ).toBe( 1 );  // orig YUI Test err msg: "The loadPage() method should have been called with a configured `pageSize` on the Collection"
			} );
			
			
			it( "load() should call the proxy's read() method, when the proxy is configured on the Collection", function() {
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy
				} );
				
				new MyCollection().load();
				
				JsMockito.verify( thisSuite.proxy ).read();
			} );
			
			
			it( "load() should call the proxy's read() method, when the proxy is configured on the Collection's Model", function() {
				var MyCollection = Collection.extend( {
					// note: no proxy of its own
					model : thisSuite.Model  // Note: a proxy is defined on the model
				} );
				
				new MyCollection().load();
				
				JsMockito.verify( thisSuite.proxy ).read();
			} );
			
			
			it( "load() should call the proxy's read() method with any `params` option provided to the method", function() {
				var operation;
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					return new jQuery.Deferred().promise();
				} );
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy
				} );
				
				
				var params = { a : 1 };
				var collection = new MyCollection();
				collection.load( {
					params : params
				} );
				
				expect( operation.getParams() ).toBe( params );
			} );
			
			
			it( "load() should set the 'loading' flag to true when loading data, and back to false when finished with a successful load", function() {
				var operation, 
				    deferred;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					operation.setResultSet( new ResultSet() );
					deferred = new jQuery.Deferred();
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be loading"
				collection.load();
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should be loading now"
				
				deferred.resolve( operation );
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered loading after the proxy finishes its load"
			} );
			
			
			it( "load() should set the 'loading' flag to true when loading data, and back to false when finished with an errored load", function() {
				var operation, 
				    deferred;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					operation.setResultSet( new ResultSet() );
					deferred = new jQuery.Deferred();
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be loading"
				collection.load();
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should be loading now"
				
				deferred.reject( operation );
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered loading after the proxy finishes its load"
			} );
			
			
			it( "load() should load the models returned by the data in the proxy", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						]
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				collection.load();
				
				expect( collection.getCount() ).toBe( 2 );  // orig YUI Test err msg: "Should be 2 models in the collection now"
			} );
			
			
			it( "load() should add the models returned by the data in the proxy, when the 'addModels' option is set to true", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 3, name: "John" },
							{ id: 4, name: "Jane" }
						]
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection( {
					data : [ { id: 1, name: "Fred" }, { id: 2, name: "Felicia" } ]
				} );
				collection.load( {
					addModels : true
				} );
				
				expect( collection.getCount() ).toBe( 4 );  // orig YUI Test err msg: "Should be 4 models in the collection now. The 2 that were loaded should have been added"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 1 );
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 2 );
				expect( collection.getAt( 2 ).get( 'id' ) ).toBe( 3 );
				expect( collection.getAt( 3 ).get( 'id' ) ).toBe( 4 );
			} );
			
			
			it( "load() should call its success/complete callbacks, resolve its deferred, and fire the 'load' event with the arguments: collection, batch", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : []
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				
				var successCallCount = 0,
				    errorCallCount = 0,
				    completeCallCount = 0,
				    doneCallCount = 0,
				    failCallCount = 0,
				    alwaysCallCount = 0,
				    loadCallCount = 0;
				
				// for checking the arguments provided to each callback (options callbacks, and promise callbacks)
				function checkCbArgs( collection, batch, cbName ) {  // cbName = the callback name. Provided by the callbacks themselves.
					expect( collection ).toBe( collectionInstance );  // orig YUI Test err msg: "the collection should have been arg 1 in " + cbName
					expect( batch instanceof BatchOperation ).toBe( true );  // orig YUI Test err msg: "Batch should have been arg 2 in " + cbName
					expect( batch.getOperations().length ).toBe( 1 );  // orig YUI Test err msg: "Batch should only have 1 Operation in " + cbName
					expect( batch.getOperations()[ 0 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's only operation in " + cbName
				}
				
				// Instantiate and run the load() method
				var collectionInstance = new MyCollection( {
					listeners : {
						'load' : function( collection, batch ) {
							loadCallCount++;
							checkCbArgs( collection, batch, "load event cb" );
						}
					}
				} );
				var promise = collectionInstance.load( {
					success : function( collection, batch ) {
						successCallCount++;
						checkCbArgs( collection, batch, "success cb" );
					},
					error : function( collection, batch ) {
						errorCallCount++;
						checkCbArgs( collection, batch, "error cb" );
					},
					complete : function( collection, batch ) {
						completeCallCount++;
						checkCbArgs( collection, batch, "complete cb" );
					}
				} )
					.done( function( collection, batch ) {
						doneCallCount++;
						checkCbArgs( collection, batch, "done cb" );
					} )
					.fail( function( collection, batch ) {
						failCallCount++;
						checkCbArgs( collection, batch, "fail cb" );
					} )
					.always( function( collection, batch ) {
						alwaysCallCount++;
						checkCbArgs( collection, batch, "always cb" );
					} );
				
				// Make sure the appropriate callbacks executed
				expect( successCallCount ).toBe( 1 );  // orig YUI Test err msg: "successCallCount"
				expect( errorCallCount ).toBe( 0 );  // orig YUI Test err msg: "errorCallCount"
				expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "completeCallCount"
				expect( doneCallCount ).toBe( 1 );  // orig YUI Test err msg: "doneCallCount"
				expect( failCallCount ).toBe( 0 );  // orig YUI Test err msg: "failCallCount"
				expect( alwaysCallCount ).toBe( 1 );  // orig YUI Test err msg: "alwaysCallCount"
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "loadCallCount"
			} );
			
			
			it( "load() should call its error/complete callbacks, reject its deferred, and fire the 'load' event with the arguments: collection, batch", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					return new jQuery.Deferred().reject( operation ).promise();
				} );
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				
				var successCallCount = 0,
				    errorCallCount = 0,
				    completeCallCount = 0,
				    doneCallCount = 0,
				    failCallCount = 0,
				    alwaysCallCount = 0,
				    loadCallCount = 0;
				
				// for checking the arguments provided to each callback (options callbacks, and promise callbacks)
				function checkCbArgs( collection, batch, cbName ) {  // cbName = the callback name. Provided by the callbacks themselves.
					expect( collection ).toBe( collectionInstance );  // orig YUI Test err msg: "the collection should have been arg 1 in " + cbName
					expect( batch instanceof BatchOperation ).toBe( true );  // orig YUI Test err msg: "Batch should have been arg 2 in " + cbName
					expect( batch.getOperations().length ).toBe( 1 );  // orig YUI Test err msg: "Batch should only have 1 Operation in " + cbName
					expect( batch.getOperations()[ 0 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's only operation in " + cbName
				}
				
				// Instantiate and run the load() method
								    var collectionInstance = new MyCollection( {
					listeners : {
						'load' : function( collection, batch ) {
							loadCallCount++;
							checkCbArgs( collection, batch, "load event cb" );
						}
					}
				} );
				var promise = collectionInstance.load( {
					success : function( collection, batch ) {
						successCallCount++;
						checkCbArgs( collection, batch, "success cb" );
					},
					error : function( collection, batch ) {
						errorCallCount++;
						checkCbArgs( collection, batch, "error cb" );
					},
					complete : function( collection, batch ) {
						completeCallCount++;
						checkCbArgs( collection, batch, "complete cb" );
					}
				} )
					.done( function( collection, batch ) {
						doneCallCount++;
						checkCbArgs( collection, batch, "done cb" );
					} )
					.fail( function( collection, batch ) {
						failCallCount++;
						checkCbArgs( collection, batch, "fail cb" );
					} )
					.always( function( collection, batch ) {
						alwaysCallCount++;
						checkCbArgs( collection, batch, "always cb" );
					} );
				
				// Make sure the appropriate callbacks executed
				expect( successCallCount ).toBe( 0 );  // orig YUI Test err msg: "successCallCount"
				expect( errorCallCount ).toBe( 1 );  // orig YUI Test err msg: "errorCallCount"
				expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "completeCallCount"
				expect( doneCallCount ).toBe( 0 );  // orig YUI Test err msg: "doneCallCount"
				expect( failCallCount ).toBe( 1 );  // orig YUI Test err msg: "failCallCount"
				expect( alwaysCallCount ).toBe( 1 );  // orig YUI Test err msg: "alwaysCallCount"
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "loadCallCount"
			} );
			
			
			it( "load() should set the totalCount property on the Collection if the property is available on the resulting ResultSet", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						],
						totalCount : 100
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "Initial Condition: the totalCount should be undefined"
				collection.load();  // deferred resolved immediately
				expect( collection.getTotalCount() ).toBe( 100 );  // orig YUI Test err msg: "The totalCount should be set to 100 now"
			} );
			
			
			it( "load() should *not* set the totalCount property on the Collection if the property is *not* available on the resulting ResultSet", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						]
						//totalCount : 100  -- not providing totalCount config
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "Initial Condition: the totalCount should be undefined"
				collection.load();  // deferred resolved immediately
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "The totalCount should still be undefined"
			} );
			
		} );
		
		
		describe( "Test loadRange()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.proxy = JsMockito.mock( Proxy.extend( {
					// Implementation of abstract interface
					create : Data.emptyFn,
					read : Data.emptyFn,
					update : Data.emptyFn,
					destroy : Data.emptyFn
				} ) );
				
				// For the base case for tests. If needing to do something different, override the particular method of interest.
				var deferred = new jQuery.Deferred();
				JsMockito.when( thisSuite.proxy ).create().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).update().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).destroy().then( function( op ) { return deferred.promise(); } );
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'id', 'name' ],
					proxy : thisSuite.proxy
				} );
			} );
			
			
			it( "loadRange() should throw an error if no proxy is configured", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						// note: no proxy, and no model
					} );
					
					new MyCollection().loadRange( 0, 9 );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a proxy configured"
				} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			} );
			
			
			it( "loadRange() should throw an error if it has no proxy but has a Model, but that model has no proxy configured", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						// note: no proxy, and a model that doesn't have a proxy
						model : Model.extend( { /* no proxy on model */ } )
					} );
					
					new MyCollection().load( 0, 9 );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a proxy configured"
				} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			} );
			
			
			it( "loadRange() should call the proxy's read() method, when the proxy is configured on the Collection (non-paged loading)", function() {
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy
				} );
				
				new MyCollection().loadRange( 0, 9 );
				
				JsMockito.verify( thisSuite.proxy ).read();
			} );
			
			
			it( "loadRange() should call the proxy's read() method, when the proxy is configured on the Collection's Model (non-paged loading)", function() {
				var MyCollection = Collection.extend( {
					// note: no proxy of its own
					model : thisSuite.Model  // Note: a proxy is defined on the model
				} );
				
				new MyCollection().loadRange( 0, 9 );
				
				JsMockito.verify( thisSuite.proxy ).read();
			} );
			
			
			it( "loadRange() should set the 'loading' flag to true when loading data, and back to false when finished with a successful load", function() {
				var operation, 
				    deferred;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					operation.setResultSet( new ResultSet() );
					deferred = new jQuery.Deferred();
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be loading"
				collection.loadRange( 0, 9 );
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should be loading now"
				
				deferred.resolve( operation );
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered loading after the proxy finishes its load"
			} );
			
			
			it( "loadRange() should set the 'loading' flag to true when loading data, and back to false when finished with an errored load", function() {
				var operation, 
				    deferred;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					operation.setResultSet( new ResultSet() );
					deferred = new jQuery.Deferred();
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be loading"
				collection.loadRange( 0, 9 );
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should be loading now"
				
				deferred.reject( operation );
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered loading after the proxy finishes its load"
			} );
			
			
			it( "loadRange() should delegate to the loadPageRange() method when the Collection is configured to load paged data.", function() {
				var loadPageRangeCallCount = 0;
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 5,
					
					loadPageRange : function( startPage, endPage ) {
						loadPageRangeCallCount++;  // to make sure the method was called
						expect( startPage ).toBe( 1 );
						expect( endPage ).toBe( 3 );  // even though we only want up to record #12, we need page 3 to cover the 10-15 range
					}
				} );
				
				new MyCollection().loadRange( 0, 12 );
				expect( loadPageRangeCallCount ).toBe( 1 );
			} );
			
			
			it( "loadRange() should call the proxy's read() method with any `params` option provided to the method", function() {
				var operation;
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					return new jQuery.Deferred().promise();
				} );
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy
				} );
				
				
				var params = { a : 1 };
				var collection = new MyCollection();
				collection.loadRange( 0, 9, {
					params : params
				} );
				
				expect( operation.getParams() ).toBe( params );
			} );
			
			
			it( "loadRange() should load the models returned by the data in the proxy", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						]
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				collection.loadRange( 0, 1 );
				
				expect( collection.getCount() ).toBe( 2 );  // orig YUI Test err msg: "Should be 2 models in the collection now"
			} );
			
			
			it( "loadRange() should add the models returned by the data in the proxy, when the 'addModels' option is set to true", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 3, name: "John" },
							{ id: 4, name: "Jane" }
						]
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection( {
					data : [ { id: 1, name: "Fred" }, { id: 2, name: "Felicia" } ]
				} );
				collection.loadRange( 2, 3, {
					addModels : true
				} );
				
				expect( collection.getCount() ).toBe( 4 );  // orig YUI Test err msg: "Should be 4 models in the collection now. The 2 that were loaded should have been added"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 1 );
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 2 );
				expect( collection.getAt( 2 ).get( 'id' ) ).toBe( 3 );
				expect( collection.getAt( 3 ).get( 'id' ) ).toBe( 4 );
			} );
			
			
			it( "loadRange() should call its success/complete callbacks, resolve its deferred, and fire the 'load' event with the arguments: collection, batch", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : []
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				
				var successCallCount = 0,
				    errorCallCount = 0,
				    completeCallCount = 0,
				    doneCallCount = 0,
				    failCallCount = 0,
				    alwaysCallCount = 0,
				    loadCallCount = 0;
				
				// for checking the arguments provided to each callback (options callbacks, and promise callbacks)
				function checkCbArgs( collection, batch, cbName ) {  // cbName = the callback name. Provided by the callbacks themselves.
					expect( collection ).toBe( collectionInstance );  // orig YUI Test err msg: "the collection should have been arg 1 in " + cbName
					expect( batch instanceof BatchOperation ).toBe( true );  // orig YUI Test err msg: "Batch should have been arg 2 in " + cbName
					expect( batch.getOperations().length ).toBe( 1 );  // orig YUI Test err msg: "Batch should only have 1 Operation in " + cbName
					expect( batch.getOperations()[ 0 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's only operation in " + cbName
				}
				
				// Instantiate and run the load() method
				var collectionInstance = new MyCollection( {
					listeners : {
						'load' : function( collection, batch ) {
							loadCallCount++;
							checkCbArgs( collection, batch, "load event cb" );
						}
					}
				} );
				var promise = collectionInstance.loadRange( 0, 9, {
					success : function( collection, batch ) {
						successCallCount++;
						checkCbArgs( collection, batch, "success cb" );
					},
					error : function( collection, batch ) {
						errorCallCount++;
						checkCbArgs( collection, batch, "error cb" );
					},
					complete : function( collection, batch ) {
						completeCallCount++;
						checkCbArgs( collection, batch, "complete cb" );
					}
				} )
					.done( function( collection, batch ) {
						doneCallCount++;
						checkCbArgs( collection, batch, "done cb" );
					} )
					.fail( function( collection, batch ) {
						failCallCount++;
						checkCbArgs( collection, batch, "fail cb" );
					} )
					.always( function( collection, batch ) {
						alwaysCallCount++;
						checkCbArgs( collection, batch, "always cb" );
					} );
				
				// Make sure the appropriate callbacks executed
				expect( successCallCount ).toBe( 1 );  // orig YUI Test err msg: "successCallCount"
				expect( errorCallCount ).toBe( 0 );  // orig YUI Test err msg: "errorCallCount"
				expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "completeCallCount"
				expect( doneCallCount ).toBe( 1 );  // orig YUI Test err msg: "doneCallCount"
				expect( failCallCount ).toBe( 0 );  // orig YUI Test err msg: "failCallCount"
				expect( alwaysCallCount ).toBe( 1 );  // orig YUI Test err msg: "alwaysCallCount"
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "loadCallCount"
			} );
			
			
			it( "loadRange() should call its error/complete callbacks, reject its deferred, and fire the 'load' event with the arguments: collection, batch", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					return new jQuery.Deferred().reject( operation ).promise();
				} );
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				
				var successCallCount = 0,
				    errorCallCount = 0,
				    completeCallCount = 0,
				    doneCallCount = 0,
				    failCallCount = 0,
				    alwaysCallCount = 0,
				    loadCallCount = 0;
				
				// for checking the arguments provided to each callback (options callbacks, and promise callbacks)
				function checkCbArgs( collection, batch, cbName ) {  // cbName = the callback name. Provided by the callbacks themselves.
					expect( collection ).toBe( collectionInstance );  // orig YUI Test err msg: "the collection should have been arg 1 in " + cbName
					expect( batch instanceof BatchOperation ).toBe( true );  // orig YUI Test err msg: "Batch should have been arg 2 in " + cbName
					expect( batch.getOperations().length ).toBe( 1 );  // orig YUI Test err msg: "Batch should only have 1 Operation in " + cbName
					expect( batch.getOperations()[ 0 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's only operation in " + cbName
				}
				
				// Instantiate and run the load() method
								    var collectionInstance = new MyCollection( {
					listeners : {
						'load' : function( collection, batch ) {
							loadCallCount++;
							checkCbArgs( collection, batch, "load event cb" );
						}
					}
				} );
				var promise = collectionInstance.loadRange( 0, 9, {
					success : function( collection, batch ) {
						successCallCount++;
						checkCbArgs( collection, batch, "success cb" );
					},
					error : function( collection, batch ) {
						errorCallCount++;
						checkCbArgs( collection, batch, "error cb" );
					},
					complete : function( collection, batch ) {
						completeCallCount++;
						checkCbArgs( collection, batch, "complete cb" );
					}
				} )
					.done( function( collection, batch ) {
						doneCallCount++;
						checkCbArgs( collection, batch, "done cb" );
					} )
					.fail( function( collection, batch ) {
						failCallCount++;
						checkCbArgs( collection, batch, "fail cb" );
					} )
					.always( function( collection, batch ) {
						alwaysCallCount++;
						checkCbArgs( collection, batch, "always cb" );
					} );
				
				// Make sure the appropriate callbacks executed
				expect( successCallCount ).toBe( 0 );  // orig YUI Test err msg: "successCallCount"
				expect( errorCallCount ).toBe( 1 );  // orig YUI Test err msg: "errorCallCount"
				expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "completeCallCount"
				expect( doneCallCount ).toBe( 0 );  // orig YUI Test err msg: "doneCallCount"
				expect( failCallCount ).toBe( 1 );  // orig YUI Test err msg: "failCallCount"
				expect( alwaysCallCount ).toBe( 1 );  // orig YUI Test err msg: "alwaysCallCount"
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "loadCallCount"
			} );
			
			
			it( "loadRange() should set the totalCount property on the Collection if the property is available on the resulting ResultSet", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						],
						totalCount : 100
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "Initial Condition: the totalCount should be undefined"
				collection.loadRange( 0, 1 );  // deferred resolved immediately
				expect( collection.getTotalCount() ).toBe( 100 );  // orig YUI Test err msg: "The totalCount should be set to 100 now"
			} );
			
			
			it( "loadRange() should *not* set the totalCount property on the Collection if the property is *not* available on the resulting ResultSet", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						]
						//totalCount : 100  -- not providing totalCount config
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection();
				
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "Initial Condition: the totalCount should be undefined"
				collection.loadRange( 0, 1 );  // deferred resolved immediately
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "The totalCount should still be undefined"
			} );
			
		} );
		
		
		describe( "Test loadPage()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.proxy = JsMockito.mock( Proxy.extend( {
					// Implementation of abstract interface
					create : Data.emptyFn,
					read : Data.emptyFn,
					update : Data.emptyFn,
					destroy : Data.emptyFn
				} ) );
				
				// For the base case for tests. If needing to do something different, override the particular method of interest.
				var deferred = new jQuery.Deferred();
				JsMockito.when( thisSuite.proxy ).create().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).update().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).destroy().then( function( op ) { return deferred.promise(); } );
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'id', 'name' ],
					proxy : thisSuite.proxy
				} );
			} );
			
			
			it( "loadPage() should throw an error if no `page` argument is provided to the method", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						proxy : thisSuite.proxy,
						pageSize : 25
					} );
					
					new MyCollection().loadPage();
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a page number provided to it"
				} ).toThrow( "'page' argument required for loadPage() method, and must be > 0" );
			} );
			
			
			it( "loadPage() should throw an error if no `pageSize` config is set on the Collection", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						proxy : thisSuite.proxy
					} );
					
					new MyCollection().loadPage( 1 );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a `pageSize` config"
				} ).toThrow( "The `pageSize` config must be set on the Collection to load paged data." );
			} );
			
			
			it( "loadPage() should throw an error if no proxy is configured", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						// note: no proxy, and no model
						pageSize : 25
					} );
					
					new MyCollection().loadPage( 1 );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a proxy configured"
				} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			} );
			
			
			it( "loadPage() should throw an error if it has no proxy but has a Model, but that model has no proxy configured", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						// note: no proxy, and a model that doesn't have a proxy
						model : Model.extend( { /* no proxy on model */ } ),
						pageSize : 25
					} );
					
					new MyCollection().loadPage( 1 );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a proxy configured"
				} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			} );
			
			
			it( "loadPage() should call the proxy's read() method, when the proxy is configured on the Collection", function() {
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				
				new MyCollection().loadPage( 1 );
				
				JsMockito.verify( thisSuite.proxy ).read();
			} );
			
			
			it( "loadPage() should call the proxy's read() method, when the proxy is configured on the Collection's Model", function() {
				var MyCollection = Collection.extend( {
					// note: no proxy of its own
					model : thisSuite.Model,  // Note: a proxy is defined on the model
					pageSize : 25
				} );
				
				new MyCollection().loadPage( 1 );
				
				JsMockito.verify( thisSuite.proxy ).read();
			} );
			
			
			it( "loadPage() should set the 'loading' flag to true when loading data, and back to false when finished with a successful load", function() {
				var operation, 
				    deferred;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					operation.setResultSet( new ResultSet() );
					deferred = new jQuery.Deferred();
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be loading"
				collection.loadPage( 1 );
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should be loading now"
				
				deferred.resolve( operation );
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered loading after the proxy finishes its load"
			} );
			
			
			it( "loadPage() should set the 'loading' flag to true when loading data, and back to false when finished with an errored load", function() {
				var operation, 
				    deferred;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					operation.setResultSet( new ResultSet() );
					deferred = new jQuery.Deferred();
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be loading"
				collection.loadPage( 1 );
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should be loading now"
				
				deferred.reject( operation );
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered loading after the proxy finishes its load"
			} );
			
			
			it( "loadPage() should call the proxy's read() method with the proper paging configs, and any `params` option provided to the method", function() {
				var operation;
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operation = op;
					return new jQuery.Deferred().promise();
				} );
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 50
				} );
				
				
				var params = { a : 1 };
				var collection = new MyCollection();
				collection.loadPage( 10, {
					params : params
				} );
				
				expect( operation.getParams() ).toBe( params );
				expect( operation.getPage() ).toBe( 10 );
				expect( operation.getPageSize() ).toBe( 50 );
				expect( operation.getStart() ).toBe( 450 );
				expect( operation.getLimit() ).toBe( 50 );
			} );
			
			
			it( "loadPage() should load the models returned by the data in the proxy", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						]
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				collection.loadPage( 1 );
				
				expect( collection.getCount() ).toBe( 2 );  // orig YUI Test err msg: "Should be 2 models in the collection now"
			} );
			
			
			it( "loadPage() should add the models returned by the data in the proxy, when the 'addModels' option is set to true", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 3, name: "John" },
							{ id: 4, name: "Jane" }
						]
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection( {
					data : [ { id: 1, name: "Fred" }, { id: 2, name: "Felicia" } ],
					pageSize : 2
				} );
				collection.loadPage( 2, {
					addModels : true
				} );
				
				expect( collection.getCount() ).toBe( 4 );  // orig YUI Test err msg: "Should be 4 models in the collection now. The 2 that were loaded should have been added"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 1 );
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 2 );
				expect( collection.getAt( 2 ).get( 'id' ) ).toBe( 3 );
				expect( collection.getAt( 3 ).get( 'id' ) ).toBe( 4 );
			} );
			
			
			it( "loadPage() should add the models returned by the data in the proxy by default, when the Collection's `clearOnPageLoad` config is false", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 3, name: "John" },
							{ id: 4, name: "Jane" }
						]
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection( {
					data : [ { id: 1, name: "Fred" }, { id: 2, name: "Felicia" } ],
					pageSize : 2,
					clearOnPageLoad : false
				} );
				collection.loadPage( 2 );
				
				expect( collection.getCount() ).toBe( 4 );  // orig YUI Test err msg: "Should be 4 models in the collection now. The 2 that were loaded should have been added"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 1 );
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 2 );
				expect( collection.getAt( 2 ).get( 'id' ) ).toBe( 3 );
				expect( collection.getAt( 3 ).get( 'id' ) ).toBe( 4 );
			} );
			
			
			it( "loadPage() should replace the existing models in the Collection upon load when the Collection's `clearOnPageLoad` config is true", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 3, name: "John" },
							{ id: 4, name: "Jane" }
						]
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection( {
					data : [ { id: 1, name: "Fred" }, { id: 2, name: "Felicia" } ],
					pageSize : 2,
					clearOnPageLoad : true
				} );
				collection.loadPage( 2 );
				
				expect( collection.getCount() ).toBe( 2 );  // orig YUI Test err msg: "Should be 4 models in the collection now. The 2 that were loaded should have been added"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 3 );
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 4 );
			} );
			
			
			it( "loadPage() should call its success/complete callbacks, resolve its deferred, and fire the 'load' event with the arguments: collection, batch", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : []
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				
				var successCallCount = 0,
				    errorCallCount = 0,
				    completeCallCount = 0,
				    doneCallCount = 0,
				    failCallCount = 0,
				    alwaysCallCount = 0,
				    loadCallCount = 0;
				
				// for checking the arguments provided to each callback (options callbacks, and promise callbacks)
				function checkCbArgs( collection, batch, cbName ) {  // cbName = the callback name. Provided by the callbacks themselves.
					expect( collection ).toBe( collectionInstance );  // orig YUI Test err msg: "the collection should have been arg 1 in " + cbName
					expect( batch instanceof BatchOperation ).toBe( true );  // orig YUI Test err msg: "Batch should have been arg 2 in " + cbName
					expect( batch.getOperations().length ).toBe( 1 );  // orig YUI Test err msg: "Batch should only have 1 Operation in " + cbName
					expect( batch.getOperations()[ 0 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's only operation in " + cbName
				}
				
				// Instantiate and run the loadPage() method
				var collectionInstance = new MyCollection( {
					listeners : {
						'load' : function( collection, batch ) {
							loadCallCount++;
							checkCbArgs( collection, batch, "load event cb" );
						}
					}
				} );
				var promise = collectionInstance.loadPage( 1, {
					success : function( collection, batch ) {
						successCallCount++;
						checkCbArgs( collection, batch, "success cb" );
					},
					error : function( collection, batch ) {
						errorCallCount++;
						checkCbArgs( collection, batch, "error cb" );
					},
					complete : function( collection, batch ) {
						completeCallCount++;
						checkCbArgs( collection, batch, "complete cb" );
					}
				} )
					.done( function( collection, batch ) {
						doneCallCount++;
						checkCbArgs( collection, batch, "done cb" );
					} )
					.fail( function( collection, batch ) {
						failCallCount++;
						checkCbArgs( collection, batch, "fail cb" );
					} )
					.always( function( collection, batch ) {
						alwaysCallCount++;
						checkCbArgs( collection, batch, "always cb" );
					} );
				
				// Make sure the appropriate callbacks executed
				expect( successCallCount ).toBe( 1 );  // orig YUI Test err msg: "successCallCount"
				expect( errorCallCount ).toBe( 0 );  // orig YUI Test err msg: "errorCallCount"
				expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "completeCallCount"
				expect( doneCallCount ).toBe( 1 );  // orig YUI Test err msg: "doneCallCount"
				expect( failCallCount ).toBe( 0 );  // orig YUI Test err msg: "failCallCount"
				expect( alwaysCallCount ).toBe( 1 );  // orig YUI Test err msg: "alwaysCallCount"
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "loadCallCount"
			} );
			
			
			it( "loadPage() should call its error/complete callbacks, reject its deferred, and fire the 'load' event with the arguments: collection, batch", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					return new jQuery.Deferred().reject( operation ).promise();
				} );
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				
				var successCallCount = 0,
				    errorCallCount = 0,
				    completeCallCount = 0,
				    doneCallCount = 0,
				    failCallCount = 0,
				    alwaysCallCount = 0,
				    loadCallCount = 0;
				
				// for checking the arguments provided to each callback (options callbacks, and promise callbacks)
				function checkCbArgs( collection, batch, cbName ) {  // cbName = the callback name. Provided by the callbacks themselves.
					expect( collection ).toBe( collectionInstance );  // orig YUI Test err msg: "the collection should have been arg 1 in " + cbName
					expect( batch instanceof BatchOperation ).toBe( true );  // orig YUI Test err msg: "Batch should have been arg 2 in " + cbName
					expect( batch.getOperations().length ).toBe( 1 );  // orig YUI Test err msg: "Batch should only have 1 Operation in " + cbName
					expect( batch.getOperations()[ 0 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's only operation in " + cbName
				}
				
				// Instantiate and run the loadPage() method
				var collectionInstance = new MyCollection( {
					listeners : {
						'load' : function( collection, batch ) {
							loadCallCount++;
							checkCbArgs( collection, batch, "load event cb" );
						}
					}
				} );
				var promise = collectionInstance.loadPage( 1, {
					success : function( collection, batch ) {
						successCallCount++;
						checkCbArgs( collection, batch, "success cb" );
					},
					error : function( collection, batch ) {
						errorCallCount++;
						checkCbArgs( collection, batch, "error cb" );
					},
					complete : function( collection, batch ) {
						completeCallCount++;
						checkCbArgs( collection, batch, "complete cb" );
					}
				} )
					.done( function( collection, batch ) {
						doneCallCount++;
						checkCbArgs( collection, batch, "done cb" );
					} )
					.fail( function( collection, batch ) {
						failCallCount++;
						checkCbArgs( collection, batch, "fail cb" );
					} )
					.always( function( collection, batch ) {
						alwaysCallCount++;
						checkCbArgs( collection, batch, "always cb" );
					} );
				
				// Make sure the appropriate callbacks executed
				expect( successCallCount ).toBe( 0 );  // orig YUI Test err msg: "successCallCount"
				expect( errorCallCount ).toBe( 1 );  // orig YUI Test err msg: "errorCallCount"
				expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "completeCallCount"
				expect( doneCallCount ).toBe( 0 );  // orig YUI Test err msg: "doneCallCount"
				expect( failCallCount ).toBe( 1 );  // orig YUI Test err msg: "failCallCount"
				expect( alwaysCallCount ).toBe( 1 );  // orig YUI Test err msg: "alwaysCallCount"
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "loadCallCount"
			} );
			
			
			it( "loadPage() should set the totalCount property on the Collection if the property is available on the resulting ResultSet", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						],
						totalCount : 100
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "Initial Condition: the totalCount should be undefined"
				collection.loadPage( 1 );  // deferred resolved immediately
				expect( collection.getTotalCount() ).toBe( 100 );  // orig YUI Test err msg: "The totalCount should be set to 100 now"
			} );
			
			
			it( "loadPage() should *not* set the totalCount property on the Collection if the property is *not* available on the resulting ResultSet", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						]
						//totalCount : 100  -- not providing totalCount config
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "Initial Condition: the totalCount should be undefined"
				collection.loadPage( 1 );  // deferred resolved immediately
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "The totalCount should still be undefined"
			} );
			
		} );
		
		
		describe( "Test loadPageRange()", function() {
			var thisSuite;
			
			beforeEach( function() {
				thisSuite = {};
				
				thisSuite.proxy = JsMockito.mock( Proxy.extend( {
					// Implementation of abstract interface
					create : Data.emptyFn,
					read : Data.emptyFn,
					update : Data.emptyFn,
					destroy : Data.emptyFn
				} ) );
				
				// For the base case for tests. If needing to do something different, override the particular method of interest.
				var deferred = new jQuery.Deferred();
				JsMockito.when( thisSuite.proxy ).create().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).update().then( function( op ) { return deferred.promise(); } );
				JsMockito.when( thisSuite.proxy ).destroy().then( function( op ) { return deferred.promise(); } );
				
				thisSuite.Model = Model.extend( {
					attributes : [ 'id', 'name' ],
					proxy : thisSuite.proxy
				} );
			} );
			
			
			it( "loadPageRange() should throw an error if no `startPage` argument is provided to the method", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						proxy : thisSuite.proxy,
						pageSize : 25
					} );
					
					new MyCollection().loadPageRange();  // missing startPage arg
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a page number provided to it"
				} ).toThrow( "`startPage` and `endPage` arguments required for loadPageRange() method, and must be > 0" );
			} );
			
			
			it( "loadPageRange() should throw an error if no `endPage` argument is provided to the method", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						proxy : thisSuite.proxy,
						pageSize : 25
					} );
					
					new MyCollection().loadPageRange( 1 );  // missing endPage arg
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a page number provided to it"
				} ).toThrow( "`startPage` and `endPage` arguments required for loadPageRange() method, and must be > 0" );
			} );
			
			
			it( "loadPageRange() should throw an error if no `pageSize` config is set on the Collection", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						proxy : thisSuite.proxy
					} );
					
					new MyCollection().loadPageRange( 1, 2 );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a `pageSize` config"
				} ).toThrow( "The `pageSize` config must be set on the Collection to load paged data." );
			} );
			
			
			it( "loadPageRange() should throw an error if no proxy is configured", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						// note: no proxy, and no model
						pageSize : 25
					} );
					
					new MyCollection().loadPageRange( 1, 2 );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a proxy configured"
				} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			} );
			
			
			it( "loadPageRange() should throw an error if it has no proxy but has a Model, but that model has no proxy configured", function() {
				expect( function() {
					var MyCollection = Collection.extend( {
						// note: no proxy, and a model that doesn't have a proxy
						model : Model.extend( { /* no proxy on model */ } ),
						pageSize : 25
					} );
					
					new MyCollection().loadPageRange( 1, 2 );
					
					expect( true ).toBe( false );  // orig YUI Test err msg: "Test should have thrown an error for not having a proxy configured"
				} ).toThrow( "data.Collection::doLoad() error: Cannot load. No `proxy` configured on the Collection or the Collection's `model`." );
			} );
			
			
			it( "loadPageRange() should call the proxy's read() method, once for each page that needs to be loaded, when the proxy is configured on the Collection", function() {
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				
				new MyCollection().loadPageRange( 1, 3 );
				
				JsMockito.verify( thisSuite.proxy, JsMockito.Verifiers.times( 3 ) ).read();
			} );
			
			
			it( "loadPageRange() should call the proxy's read() method, once for each page that needs to be loaded, when the proxy is configured on the Collection's Model", function() {
				var MyCollection = Collection.extend( {
					// note: no proxy of its own
					model : thisSuite.Model,  // Note: a proxy is defined on the model
					pageSize : 25
				} );
				
				new MyCollection().loadPageRange( 1, 3 );
				
				JsMockito.verify( thisSuite.proxy, JsMockito.Verifiers.times( 3 ) ).read();
			} );
			
			
			it( "loadPageRange() should set the 'loading' flag to true when loading data, and back to false when finished with a successful load of *all* pages", function() {
				var operations = [], 
				    deferreds = [];
				
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet() );
					operations.push( operation );
					
					var deferred = new jQuery.Deferred();
					deferreds.push( deferred );
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be loading"
				collection.loadPageRange( 1, 2 );
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should be loading now"
				
				// Resolve the first Proxy read operation's deferred
				deferreds[ 0 ].resolve( operations[ 0 ] );
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should still be considered loading after only one of two requests has finished"
				
				// Now resolve the second read operation's deferred. The collection should now no longer be considered loading.
				deferreds[ 1 ].resolve( operations[ 1 ] );
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered loading after the proxy finishes its load"
			} );
			
			
			it( "loadPageRange() should set the 'loading' flag to true when loading data, and back to false when finished with an errored load of even just one of the pages", function() {
				var operations = [], 
				    deferreds = [];
				
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet() );
					operations.push( operation );
					
					var deferred = new jQuery.Deferred();
					deferreds.push( deferred );
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "Initial condition: the collection should not be loading"
				collection.loadPageRange( 1, 2 );
				expect( collection.isLoading() ).toBe( true );  // orig YUI Test err msg: "The collection should be loading now"
				
				// Reject the first Proxy read operation's deferred
				deferreds[ 0 ].reject( operations[ 0 ] );
				expect( collection.isLoading() ).toBe( false );  // orig YUI Test err msg: "The collection should no longer be considered loading after the proxy has errored for one of the requests"
			} );
			
			
			it( "loadPageRange() should call the proxy's read() method with the proper paging configs, and any `params` option provided to the method", function() {
				var operations = [];
				JsMockito.when( thisSuite.proxy ).read().then( function( op ) {
					operations.push( op );
					return new jQuery.Deferred().promise();
				} );
				
				var MyCollection = Collection.extend( {
					proxy : thisSuite.proxy,
					pageSize : 10
				} );
				
				
				var params = { a : 1 };
				var collection = new MyCollection();
				collection.loadPageRange( 1, 3, {
					params : params
				} );
				
				expect( operations.length ).toBe( 3 );  // orig YUI Test err msg: "Proxy should have been called 3 times, creating 3 operation objects"
				
				expect( operations[ 0 ].getParams() ).toBe( params );
				expect( operations[ 0 ].getPage() ).toBe( 1 );
				expect( operations[ 0 ].getPageSize() ).toBe( 10 );
				expect( operations[ 0 ].getStart() ).toBe( 0 );
				expect( operations[ 0 ].getLimit() ).toBe( 10 );
				
				expect( operations[ 1 ].getParams() ).toBe( params );
				expect( operations[ 1 ].getPage() ).toBe( 2 );
				expect( operations[ 1 ].getPageSize() ).toBe( 10 );
				expect( operations[ 1 ].getStart() ).toBe( 10 );
				expect( operations[ 1 ].getLimit() ).toBe( 10 );
				
				expect( operations[ 2 ].getParams() ).toBe( params );
				expect( operations[ 2 ].getPage() ).toBe( 3 );
				expect( operations[ 2 ].getPageSize() ).toBe( 10 );
				expect( operations[ 2 ].getStart() ).toBe( 20 );
				expect( operations[ 2 ].getLimit() ).toBe( 10 );
			} );
			
			
			it( "loadPageRange() should load the models returned by the data in the proxy, in the order of the page operations", function() {
				var deferreds = [];  // for storing each of the proxy's deferreds, so we can resolve them out of order
				var operations = []; // for storing the operation objects that the Collection creates for each request
				var recordSets = [   // for returning new data for each "page load"
					[ { id: 1, name: "John" }, { id: 2, name: "Jane" } ],
					[ { id: 3, name: "Greg" }, { id: 4, name: "Jeff" } ],
					[ { id: 5, name: "Andy" }, { id: 6, name: "Sarah" } ]
				];
				var opNum = -1;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					opNum++;
					operation.setResultSet( new ResultSet( {
						records : recordSets[ opNum ]
					} ) );
					operations.push( operation );
					
					var deferred = new jQuery.Deferred();
					deferreds.push( deferred );
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 2
				} );
				var collection = new MyCollection();
				collection.loadPageRange( 1, 3 );
				
				// Resolve the deferreds out of order
				deferreds[ 2 ].resolve( operations[ 2 ] );
				deferreds[ 0 ].resolve( operations[ 0 ] );
				deferreds[ 1 ].resolve( operations[ 1 ] );
				
				expect( collection.getCount() ).toBe( 6 );  // orig YUI Test err msg: "Should be 6 models in the collection now"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 1 );  // orig YUI Test err msg: "model w/ id 1 should be at index 0"
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 2 );  // orig YUI Test err msg: "model w/ id 2 should be at index 1"
				expect( collection.getAt( 2 ).get( 'id' ) ).toBe( 3 );  // orig YUI Test err msg: "model w/ id 3 should be at index 2"
				expect( collection.getAt( 3 ).get( 'id' ) ).toBe( 4 );  // orig YUI Test err msg: "model w/ id 4 should be at index 3"
				expect( collection.getAt( 4 ).get( 'id' ) ).toBe( 5 );  // orig YUI Test err msg: "model w/ id 5 should be at index 4"
				expect( collection.getAt( 5 ).get( 'id' ) ).toBe( 6 );  // orig YUI Test err msg: "model w/ id 6 should be at index 5"
			} );
			
			
			it( "loadPageRange() should add the models returned by the data in the proxy, when the 'addModels' option is set to true", function() {
				var deferreds = [];  // for storing each of the proxy's deferreds, so we can resolve them out of order
				var operations = []; // for storing the operation objects that the Collection creates for each request
				var recordSets = [   // for returning new data for each "page load"
					[ { id: 3, name: "Greg" }, { id: 4, name: "Jeff" } ],
					[ { id: 5, name: "Andy" }, { id: 6, name: "Sarah" } ]
				];
				var opNum = -1;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					opNum++;
					operation.setResultSet( new ResultSet( {
						records : recordSets[ opNum ]
					} ) );
					operations.push( operation );
					
					var deferred = new jQuery.Deferred();
					deferreds.push( deferred );
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection( {
					data : [ { id: 1, name: "Fred" }, { id: 2, name: "Felicia" } ],
					pageSize : 2
				} );
				collection.loadPageRange( 2, 3, {
					addModels : true
				} );
				
				// Resolve the deferreds out of order, just to check
				deferreds[ 1 ].resolve( operations[ 1 ] );
				deferreds[ 0 ].resolve( operations[ 0 ] );
				
				expect( collection.getCount() ).toBe( 6 );  // orig YUI Test err msg: "Should be 6 models in the collection now. The 2 that were loaded should have been added"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 1 );  // orig YUI Test err msg: "model w/ id 1 should be at index 0"
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 2 );  // orig YUI Test err msg: "model w/ id 2 should be at index 1"
				expect( collection.getAt( 2 ).get( 'id' ) ).toBe( 3 );  // orig YUI Test err msg: "model w/ id 3 should be at index 2"
				expect( collection.getAt( 3 ).get( 'id' ) ).toBe( 4 );  // orig YUI Test err msg: "model w/ id 4 should be at index 3"
				expect( collection.getAt( 4 ).get( 'id' ) ).toBe( 5 );  // orig YUI Test err msg: "model w/ id 5 should be at index 4"
				expect( collection.getAt( 5 ).get( 'id' ) ).toBe( 6 );  // orig YUI Test err msg: "model w/ id 6 should be at index 5"
			} );
			
			
			it( "loadPageRange() should add the models returned by the data in the proxy by default, when the Collection's `clearOnPageLoad` config is false", function() {
				var deferreds = [];  // for storing each of the proxy's deferreds, so we can resolve them out of order
				var operations = []; // for storing the operation objects that the Collection creates for each request
				var recordSets = [   // for returning new data for each "page load"
					[ { id: 3, name: "Greg" }, { id: 4, name: "Jeff" } ],
					[ { id: 5, name: "Andy" }, { id: 6, name: "Sarah" } ]
				];
				var opNum = -1;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					opNum++;
					operation.setResultSet( new ResultSet( {
						records : recordSets[ opNum ]
					} ) );
					operations.push( operation );
					
					var deferred = new jQuery.Deferred();
					deferreds.push( deferred );
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection( {
					data : [ { id: 1, name: "Fred" }, { id: 2, name: "Felicia" } ],
					pageSize : 2,
					clearOnPageLoad : false
				} );
				collection.loadPageRange( 2, 3 );
				
				// Resolve the deferreds out of order, just to check
				deferreds[ 1 ].resolve( operations[ 1 ] );
				deferreds[ 0 ].resolve( operations[ 0 ] );
				
				expect( collection.getCount() ).toBe( 6 );  // orig YUI Test err msg: "Should be 6 models in the collection now. The 2 that were loaded should have been added"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 1 );  // orig YUI Test err msg: "model w/ id 1 should be at index 0"
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 2 );  // orig YUI Test err msg: "model w/ id 2 should be at index 1"
				expect( collection.getAt( 2 ).get( 'id' ) ).toBe( 3 );  // orig YUI Test err msg: "model w/ id 3 should be at index 2"
				expect( collection.getAt( 3 ).get( 'id' ) ).toBe( 4 );  // orig YUI Test err msg: "model w/ id 4 should be at index 3"
				expect( collection.getAt( 4 ).get( 'id' ) ).toBe( 5 );  // orig YUI Test err msg: "model w/ id 5 should be at index 4"
				expect( collection.getAt( 5 ).get( 'id' ) ).toBe( 6 );  // orig YUI Test err msg: "model w/ id 6 should be at index 5"
			} );
			
			
			it( "loadPageRange() should replace the existing models in the Collection upon load when the Collection's `clearOnPageLoad` config is true", function() {
				var deferreds = [];  // for storing each of the proxy's deferreds, so we can resolve them out of order
				var operations = []; // for storing the operation objects that the Collection creates for each request
				var recordSets = [   // for returning new data for each "page load"
					[ { id: 3, name: "Greg" }, { id: 4, name: "Jeff" } ],
					[ { id: 5, name: "Andy" }, { id: 6, name: "Sarah" } ]
				];
				var opNum = -1;
				
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					opNum++;
					operation.setResultSet( new ResultSet( {
						records : recordSets[ opNum ]
					} ) );
					operations.push( operation );
					
					var deferred = new jQuery.Deferred();
					deferreds.push( deferred );
					
					return deferred.promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy
				} );
				var collection = new MyCollection( {
					data : [ { id: 1, name: "Fred" }, { id: 2, name: "Felicia" } ],
					pageSize : 2,
					clearOnPageLoad : true
				} );
				collection.loadPageRange( 2, 3 );
				
				// Resolve the deferreds out of order, just to check
				deferreds[ 1 ].resolve( operations[ 1 ] );
				deferreds[ 0 ].resolve( operations[ 0 ] );
				
				expect( collection.getCount() ).toBe( 4 );  // orig YUI Test err msg: "Should be 4 models in the collection now. The 2 that existed should have been removed"
				expect( collection.getAt( 0 ).get( 'id' ) ).toBe( 3 );  // orig YUI Test err msg: "model w/ id 3 should be at index 0"
				expect( collection.getAt( 1 ).get( 'id' ) ).toBe( 4 );  // orig YUI Test err msg: "model w/ id 4 should be at index 1"
				expect( collection.getAt( 2 ).get( 'id' ) ).toBe( 5 );  // orig YUI Test err msg: "model w/ id 5 should be at index 2"
				expect( collection.getAt( 3 ).get( 'id' ) ).toBe( 6 );  // orig YUI Test err msg: "model w/ id 6 should be at index 3"
			} );
			
			
			it( "loadPageRange() should call its success/complete callbacks, resolve its deferred, and fire the 'load' event with the arguments: collection, batch", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : []
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				
				var successCallCount = 0,
				    errorCallCount = 0,
				    completeCallCount = 0,
				    doneCallCount = 0,
				    failCallCount = 0,
				    alwaysCallCount = 0,
				    loadCallCount = 0;
				
				// for checking the arguments provided to each callback (options callbacks, and promise callbacks)
				function checkCbArgs( collection, batch, cbName ) {  // cbName = the callback name. Provided by the callbacks themselves.
					expect( collection ).toBe( collectionInstance );  // orig YUI Test err msg: "the collection should have been arg 1 in " + cbName
					expect( batch instanceof BatchOperation ).toBe( true );  // orig YUI Test err msg: "Batch should have been arg 2 in " + cbName
					expect( batch.getOperations().length ).toBe( 2 );  // orig YUI Test err msg: "Batch should have exactly 2 Operations in " + cbName
					expect( batch.getOperations()[ 0 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's first Operation in " + cbName
					expect( batch.getOperations()[ 1 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's second Operation in " + cbName
				}
				
				// Instantiate and run the loadPageRange() method
				var collectionInstance = new MyCollection( {
					listeners : {
						'load' : function( collection, batch ) {
							loadCallCount++;
							checkCbArgs( collection, batch, "load event cb" );
						}
					}
				} );
				
				var promise = collectionInstance.loadPageRange( 1, 2, {
					success : function( collection, batch ) {
						successCallCount++;
						checkCbArgs( collection, batch, "success cb" );
					},
					error : function( collection, batch ) {
						errorCallCount++;
						checkCbArgs( collection, batch, "error cb" );
					},
					complete : function( collection, batch ) {
						completeCallCount++;
						checkCbArgs( collection, batch, "complete cb" );
					}
				} )
					.done( function( collection, batch ) {
						doneCallCount++;
						checkCbArgs( collection, batch, "done cb" );
					} )
					.fail( function( collection, batch ) {
						failCallCount++;
						checkCbArgs( collection, batch, "fail cb" );
					} )
					.always( function( collection, batch ) {
						alwaysCallCount++;
						checkCbArgs( collection, batch, "always cb" );
					} );
				
				// Make sure the appropriate callbacks executed
				expect( successCallCount ).toBe( 1 );  // orig YUI Test err msg: "successCallCount"
				expect( errorCallCount ).toBe( 0 );  // orig YUI Test err msg: "errorCallCount"
				expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "completeCallCount"
				expect( doneCallCount ).toBe( 1 );  // orig YUI Test err msg: "doneCallCount"
				expect( failCallCount ).toBe( 0 );  // orig YUI Test err msg: "failCallCount"
				expect( alwaysCallCount ).toBe( 1 );  // orig YUI Test err msg: "alwaysCallCount"
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "loadCallCount"
			} );
			
			
			it( "loadPageRange() should call its error/complete callbacks, reject its deferred, and fire the 'load' event with the arguments: collection, batch", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					return new jQuery.Deferred().reject( operation ).promise();
				} );
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				
				var successCallCount = 0,
				    errorCallCount = 0,
				    completeCallCount = 0,
				    doneCallCount = 0,
				    failCallCount = 0,
				    alwaysCallCount = 0,
				    loadCallCount = 0;
				
				// for checking the arguments provided to each callback (options callbacks, and promise callbacks)
				function checkCbArgs( collection, batch, cbName ) {  // cbName = the callback name. Provided by the callbacks themselves.
					expect( collection ).toBe( collectionInstance );  // orig YUI Test err msg: "the collection should have been arg 1 in " + cbName
					expect( batch instanceof BatchOperation ).toBe( true );  // orig YUI Test err msg: "Batch should have been arg 2 in " + cbName
					expect( batch.getOperations().length ).toBe( 2 );  // orig YUI Test err msg: "Batch should have exactly 2 Operations in " + cbName
					expect( batch.getOperations()[ 0 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's first Operation in " + cbName
					expect( batch.getOperations()[ 1 ] instanceof ReadOperation ).toBe( true );  // orig YUI Test err msg: "ReadOperation should have been the batch's second Operation in " + cbName
				}
				
				// Instantiate and run the loadPageRange() method
				var collectionInstance = new MyCollection( {
					listeners : {
						'load' : function( collection, batch ) {
							loadCallCount++;
							checkCbArgs( collection, batch, "load event cb" );
						}
					}
				} );
				
				var promise = collectionInstance.loadPageRange( 1, 2, {
					success : function( collection, batch ) {
						successCallCount++;
						checkCbArgs( collection, batch, "success cb" );
					},
					error : function( collection, batch ) {
						errorCallCount++;
						checkCbArgs( collection, batch, "error cb" );
					},
					complete : function( collection, batch ) {
						completeCallCount++;
						checkCbArgs( collection, batch, "complete cb" );
					}
				} )
					.done( function( collection, batch ) {
						doneCallCount++;
						checkCbArgs( collection, batch, "done cb" );
					} )
					.fail( function( collection, batch ) {
						failCallCount++;
						checkCbArgs( collection, batch, "fail cb" );
					} )
					.always( function( collection, batch ) {
						alwaysCallCount++;
						checkCbArgs( collection, batch, "always cb" );
					} );
				
				// Make sure the appropriate callbacks executed
				expect( successCallCount ).toBe( 0 );  // orig YUI Test err msg: "successCallCount"
				expect( errorCallCount ).toBe( 1 );  // orig YUI Test err msg: "errorCallCount"
				expect( completeCallCount ).toBe( 1 );  // orig YUI Test err msg: "completeCallCount"
				expect( doneCallCount ).toBe( 0 );  // orig YUI Test err msg: "doneCallCount"
				expect( failCallCount ).toBe( 1 );  // orig YUI Test err msg: "failCallCount"
				expect( alwaysCallCount ).toBe( 1 );  // orig YUI Test err msg: "alwaysCallCount"
				expect( loadCallCount ).toBe( 1 );  // orig YUI Test err msg: "loadCallCount"
			} );
			
			
			it( "loadPageRange() should set the totalCount property on the Collection if the property is available on the resulting ResultSet from the first Operation (the sampling Operation)", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						],
						totalCount : 100
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "Initial Condition: the totalCount should be undefined"
				collection.loadPageRange( 1, 3 );  // deferred resolved immediately
				expect( collection.getTotalCount() ).toBe( 100 );  // orig YUI Test err msg: "The totalCount should be set to 100 now"
			} );
			
			
			it( "loadPageRange() should *not* set the totalCount property on the Collection if the property is *not* available on the resulting ResultSet from the first Operation (the sampling Operation)", function() {
				JsMockito.when( thisSuite.proxy ).read().then( function( operation ) {
					operation.setResultSet( new ResultSet( {
						records : [ 
							{ id: 1, name: "John" },
							{ id: 2, name: "Jane" }
						]
						//totalCount : 100  -- not providing totalCount config
					} ) );
					return new jQuery.Deferred().resolve( operation ).promise();
				} );
				
				
				var MyCollection = Collection.extend( {
					model : thisSuite.Model,
					proxy : thisSuite.proxy,
					pageSize : 25
				} );
				var collection = new MyCollection();
				
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "Initial Condition: the totalCount should be undefined"
				collection.loadPageRange( 1, 3 );  // deferred resolved immediately
				expect( _.isUndefined( collection.getTotalCount() ) ).toBe( true );  // orig YUI Test err msg: "The totalCount should still be undefined"
			} );
			
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
			
			
			it( "sync() should create (save) models that are new", function() {
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
			
			
			it( "sync() should save models that have been modified", function() {
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
			
			
			it( "sync() should destroy models that have been removed from the collection", function() {
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
			
			
			it( "sync() should destroy models that have been removed from the collection in more than one call to remove() (to make sure the 'removedModels' is cumulative)", function() {
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
			
			
			it( "sync() should destroy models that have been removed from the collection, but if one fails, only that one should be attempted to be destroyed again upon the next sync()", function() {
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
			
			
			it( "sync() should destroy models that have been removed from the collection only on the first call to sync(). They should not be destroyed again afterwards.", function() {
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
			
			
			it( "sync() should save models that are new and modified, and destroy models that have been removed.", function() {
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
			
			
			it( "sync() should call the 'success' and 'complete' callbacks when no persistence operations need to be done on any of the Collection's models", function() {
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
			
			
			it( "sync() should call the 'success' and 'complete' callbacks if all persistence operations succeed", function() {
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
			
			
			it( "sync() should call the 'error' and 'complete' callbacks if all persistence operations fail", function() {
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
			
			
			it( "sync() should call the 'error' and 'complete' callbacks if just one of the persistence operations fail (in this case, the first persistence operation)", function() {
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
			
			
			it( "sync() should call the 'error' and 'complete' callbacks if just one of the persistence operations fail (in this case, a middle persistence operation)", function() {
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
			
			
			it( "sync() should call the 'error' and 'complete' callbacks if just one of the persistence operations fail (in this case, the last persistence operation)", function() {
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
			
			
			it( "sync() should return a jQuery.Promise object which has its `done` and `always` callbacks executed when no models in the Collection need to be persisted", function() {
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
			
			
			it( "sync() should return a jQuery.Promise object which has its `done` and `always` callbacks executed when the sync of Models in the Collection succeeds", function() {
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
			
			
			it( "sync() should return a jQuery.Promise object which has its `fail` and `always` callbacks executed when at least one of the operations of the sync fails", function() {
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