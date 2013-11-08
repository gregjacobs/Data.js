/*global define, expect */
define( [
	'lodash',
	'Class',
	
	'data/Model',
	'data/persistence/operation/Load',
	'data/persistence/operation/Save',
	'data/persistence/operation/Destroy',
	'data/persistence/operation/Promise'
], function( _, Class, Model, LoadOperation, SaveOperation, DestroyOperation, OperationPromise ) {
	
	/**
	 * @class spec.lib.ModelPersistenceVerifier
	 * 
	 * A helper fixture for testing the persistence features of {@link data.Model Models}.
	 * 
	 * This fixture is used to help test the {@link data.Model#load load}, {@link data.Model#save save}, and
	 * {@link data.Model#destroy destroy} methods, by checking that all of the events, options-provided callbacks, 
	 * and promise handler callbacks have been properly executed by the source code. It also makes sure that all
	 * callbacks/handlers are passed the correct arguments.
	 * 
	 * 
	 * ## Usage
	 * 
	 * When instantiated, a {@link data.Model} must be passed in as the {@link #model} config. From there, the
	 * {@link #execute} method should be executed with the method name (such as 'load', 'save', 'destroy', etc.) 
	 * to start the test.
	 * 
	 * When the model's {@link data.Model#proxy proxy} is complete, execute the {@link #verify} method to verify
	 * that the appropriate events/callbacks/handlers have been called.
	 * 
	 * 
	 * ## Example
	 * 
	 *     require( [
	 *         'data/Model',
	 *         'spec/lib/ManualProxy',
	 *         'spec/lib/ModelPersistenceVerifier'
	 *     ], function( Model, ManualProxy, ModelPersistenceVerifier ) {
	 *     
	 *         describe( "data.Model", function() {
	 *         
	 *             it( "should load data and fire all of the appropriate callbacks", function() {
	 *                 // These two statements would probably go in a beforeEach()
	 *                 var manualProxy = new ManualProxy();
	 *                 var ManualProxyModel = Model.extend( {
	 *                     attributes : [ 'id', 'attr' ],
	 *                     proxy : manualProxy
	 *                 } );
	 *                 
	 *                 
	 *                 var model = new ManualProxyModel( { id: 1 } ),
	 *                     modelPersistenceVerifier = new ModelPersistenceVerifier( { model: model } );
	 *                 
	 *                 modelPersistenceVerifier.execute( 'load' );
	 *                 
	 *                 manualProxy.resolveRead( 0 );  // Resolve the "read" request that the load operation performed (the first 'read' request), and 
	 *                 modelPersistenceVerifier.verify( 'success' );  // verify that the appropriate events/callbacks/handlers were called - executes Jasmine expect() statements
	 *             } );
	 *             
	 *         } );
	 *         
	 *     } );
	 */
	var ModelPersistenceVerifier = Class.create( {
		
		/**
		 * @cfg {data.Model} model (required)
		 * 
		 * The Model instance which is to be tested. The persistence method will be executed
		 * on this model via the {@link #execute} method.
		 */
		
		
		/**
		 * @constructor
		 * @param {Object} cfg The configuration options for this class, specified in an Object (map)
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );  // copy all properties on `cfg` to `this`
			
			// Check required configs
			if( !this.model || !( this.model instanceof Model ) ) throw new Error( "`model` cfg required, and must be a data.Model instance" );
			
			
			// Initialize counts for verification of test outcome
			this.beginEventCount = 0;
			this.successEventCount = 0;
			this.errorEventCount = 0;
			this.cancelEventCount = 0;
			this.completeEventCount = 0;
			
			this.successCbCallCount = 0;
			this.errorCbCallCount = 0;
			this.cancelCbCallCount = 0;
			this.completeCbCallCount = 0;
			
			this.doneCallCount = 0;
			this.failCallCount = 0;
			this.cancelCallCount = 0;
			this.alwaysCallCount = 0;
		},
		
		
		/**
		 * Executes the given persistence `methodName` on the {@link #model}.
		 * 
		 * @param {String} methodName The name of the method to execute. Must be one of: 'load', 'save', 'destroy'
		 * @return {data.persistence.operation.Promise} The OperationPromise object returned by the method under test.
		 *   This will represent either the 'load', 'save', or 'destroy' operation.
		 */
		execute : function( methodName ) {
			if( !_.contains( [ 'load', 'save', 'destroy' ], methodName ) )
				throw new Error( "`methodName` arg must be one of: 'load', 'save', 'destroy'" );
			
			
			// Block multiple executions of the execute() method
			if( this.executed ) throw new Error( "ModelPersistenceVerifier has already executed the model's persistence method. Create a new instance for another persistence method call verification." );
			this.executed = true;
			
			var me = this,  // for closures
			    modelInstance = this.model,
			    OperationClass,
			    scopeObj = {};  // an object for testing the scope that callbacks provided to the method are called in
			
			// Assign the OperationClass for verification
			switch( methodName ) {
				case 'load'    : OperationClass = LoadOperation; break;
				case 'save'    : OperationClass = SaveOperation; break;
				case 'destroy' : OperationClass = DestroyOperation; break;
				default        : throw new Error( "unhandled case" );
			}
			
			// Check the initial state of the model before the persistence method is called
			expect( modelInstance.isLoading() ).toBe( false );
			expect( modelInstance.isSaving() ).toBe( false );
			expect( modelInstance.isDestroying() ).toBe( false );
			expect( modelInstance.isDestroyed() ).toBe( false );
			
			
			// Assign event handlers
			modelInstance.on( methodName + 'begin', function( model, operation ) {    // ex: 'loadbegin' event
				me.beginEventCount++;
				expect( model ).toBe( modelInstance );
			} );
			modelInstance.on( methodName + 'success', function( model, operation ) {  // ex: 'loadsuccess' event
				me.successEventCount++;
				expect( model ).toBe( modelInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			modelInstance.on( methodName + 'error', function( model, operation ) {    // ex: 'loaderror' event
				me.errorEventCount++;
				expect( model ).toBe( modelInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			modelInstance.on( methodName + 'cancel', function( model, operation ) {   // ex: 'loadcancel' event
				me.cancelEventCount++;
				expect( model ).toBe( modelInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			modelInstance.on( methodName, function( model, operation ) {              // ex: 'load' event
				me.completeEventCount++;
				expect( model ).toBe( modelInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			
			
			// Call the persistence method
			var operationPromise = modelInstance[ methodName ]( {
				success : function( model, operation ) {
					me.successCbCallCount++;
					expect( model ).toBe( modelInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				},
				error : function( model, operation ) {
					me.errorCbCallCount++;
					expect( model ).toBe( modelInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				},
				cancel : function( model, operation ) {
					me.cancelCbCallCount++;
					expect( model ).toBe( modelInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				},
				complete : function( model, operation ) {
					me.completeCbCallCount++;
					expect( model ).toBe( modelInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				}
			} );
			
			// Verify that the method returned an OperationPromise object
			expect( operationPromise instanceof OperationPromise ).toBe( true );
			
			// Attach promise handlers
			operationPromise
				.done( function( model, operation ) {
					me.doneCallCount++;
					expect( model ).toBe( modelInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} )
				.fail( function( model, operation ) {
					me.failCallCount++;
					expect( model ).toBe( modelInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} )
				.cancel( function( model, operation ) {
					me.cancelCallCount++;
					expect( model ).toBe( modelInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} )
				.always( function( model, operation ) {
					me.alwaysCallCount++;
					expect( model ).toBe( modelInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} );
			
			
			// Check that appropriate "begin" was fired (such as 'loadbegin'), but not the "complete" event 
			// yet (such as 'load'). Also, check that the Model is in the appropriate state (such as 'loading', or 'saving').
			expect( this.beginEventCount ).toBe( 1 );
			expect( this.completeEventCount ).toBe( 0 );
			
			expect( modelInstance.isLoading() ).toBe( methodName === 'load' ? true : false );
			expect( modelInstance.isSaving() ).toBe( methodName === 'save' ? true : false );
			expect( modelInstance.isDestroying() ).toBe( methodName === 'destroy' ? true : false );
			expect( modelInstance.isDestroyed() ).toBe( false );
			
			return operationPromise;
		},
		
		
		/**
		 * Verifies the outcome of the fixture's execution of the test {@link #method}.
		 * 
		 * This should be called after the completion of the persistence operation, whether the persistence operation
		 * was successful, has errored, or has been canceled.
		 * 
		 * @param {String} expectedOutcome The expected outcome after the persistence operation ('load', 'save', or 'destroy')
		 * has been completed. Must be one of: 'success', 'error', or 'cancel'.
		 */
		verify : function( expectedOutcome ) {
			if( !_.contains( [ 'success', 'error', 'cancel' ], expectedOutcome ) ) 
				throw new Error( "`expectedOutcome` arg must be one of: 'success', 'error', 'cancel'" );
			
			// Check the state of the model in its "completed" state
			var model = this.model;
			expect( model.isLoading() ).toBe( false );
			expect( model.isSaving() ).toBe( false );
			expect( model.isDestroying() ).toBe( false );
			
			// Make sure the appropriate events/callbacks/handlers executed
			expect( this.beginEventCount ).toBe( 1 );    // make sure it wasn't fired again
			expect( this.successEventCount ).toBe( expectedOutcome === 'success' ? 1 : 0 );  // ex: 'loadsuccess' event
			expect( this.errorEventCount ).toBe( expectedOutcome === 'error' ? 1 : 0 );      // ex: 'loaderror' event
			expect( this.cancelEventCount ).toBe( expectedOutcome === 'cancel' ? 1 : 0 );    // ex: 'loadcancel' event
			expect( this.completeEventCount ).toBe( 1 );                                     // ex: 'load' event, which really means "load complete"
			
			expect( this.successCbCallCount ).toBe( expectedOutcome === 'success' ? 1 : 0 );
			expect( this.errorCbCallCount ).toBe( expectedOutcome === 'error' ? 1 : 0 );
			expect( this.cancelCbCallCount ).toBe( expectedOutcome === 'cancel' ? 1 : 0 );
			expect( this.completeCbCallCount ).toBe( 1 );
			
			expect( this.doneCallCount ).toBe( expectedOutcome === 'success' ? 1 : 0 );
			expect( this.failCallCount ).toBe( expectedOutcome === 'error' ? 1 : 0 );
			expect( this.cancelCallCount ).toBe( expectedOutcome === 'cancel' ? 1 : 0 );
			expect( this.alwaysCallCount ).toBe( 1 );
		}
	
	} );
	
	
	return ModelPersistenceVerifier;
	
} );