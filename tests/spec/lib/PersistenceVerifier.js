/*global define, expect */
define( [
	'lodash',
	'Class',
	
	'data/Model',
	'data/persistence/operation/Operation',
	'data/persistence/operation/Load',
	'data/persistence/operation/Save',
	'data/persistence/operation/Destroy'
], function( _, Class, Model, Operation, LoadOperation, SaveOperation, DestroyOperation ) {
	
	/**
	 * @class spec.lib.PersistenceVerifier
	 * 
	 * A helper fixture for testing the persistence features of {@link data.Model Model} and 
	 * {@link data.Collection Collection}. See subclasses for details:
	 * 
	 * - {@link spec.lib.ModelPersistenceVerifier}
	 * - {@link spec.lib.CollectionPersistenceVerifier}
	 */
	var PersistenceVerifier = Class.create( {
		abstractClass : true,
		
		
		/**
		 * @constructor
		 * @param {Object} cfg The configuration options for this class, specified in an Object (map)
		 */
		constructor : function( cfg ) {
			_.assign( this, cfg );  // copy all properties on `cfg` to `this`
			
			// Initialize counts for verification of test outcome
			this.beginEventCount = 0;
			this.progressEventCount = 0;
			this.successEventCount = 0;
			this.errorEventCount = 0;
			this.cancelEventCount = 0;
			this.completeEventCount = 0;
			
			this.progressCbCallCount = 0;
			this.successCbCallCount = 0;
			this.errorCbCallCount = 0;
			this.cancelCbCallCount = 0;
			this.completeCbCallCount = 0;
			
			this.progressCallCount = 0;
			this.doneCallCount = 0;
			this.failCallCount = 0;
			this.cancelCallCount = 0;
			this.alwaysCallCount = 0;
		},
		
		
		/**
		 * Retrieves the DataComponent ({@link data.Model Model} or {@link data.Collection Collection}) that will
		 * be used by {@link #execute} for the test.
		 * 
		 * Must be implemented by subclass.
		 * 
		 * @abstract
		 * @protected
		 * @method getDataComponent
		 * @return {data.DataComponent}
		 */
		getDataComponent : Class.abstractMethod,
		
		
		/**
		 * Retrieves the {@link data.persistence.operation.Operation} class that is expected for the given
		 * input `methodName`.
		 * 
		 * For example, the 'load' method should return a reference to the {@link data.persistence.operation.Load LoadOperation}
		 * class (constructor function).
		 * 
		 * @abstract
		 * @protected
		 * @method getOperationClass
		 * @param {String} methodName The name of the method under test.
		 * @return {Function} The class (constructor function) for the appropriate {@link data.persistence.operation.Operation Operation},
		 *   given the input `methodName`.
		 */
		getOperationClass : Class.abstractMethod,
		
		
		/**
		 * Retrieves the name of the event which should be monitored for the method under test (`methodName`).
		 * 
		 * Most often, the event name is the same as the method name. However, if a translation may occur, then this
		 * method may be overridden in subclasses to do so. For example, {@link data.Collection} uses the 'load' event 
		 * for its {@link data.Collection#loadPage loadPage}, {@link data.Collection#loadRange loadRange}, and 
		 * {@link data.Collection#loadPageRange loadPageRange} methods.
		 * 
		 * @protected
		 * @method getEventName
		 * @param {String} methodName The name of the method under test.
		 * @return {String} The event name to monitor for the method under test.
		 */
		getEventName : function( methodName ) {
			return methodName;
		},
		
		
		/**
		 * Executes the given persistence `methodName` on the data component (Model or Collection).
		 * 
		 * This is a template method, which calls the following hook methods for subclasses:
		 * 
		 * - {@link #onBeforeExecute}: Hook point for before the `methodName` is called on the data component.
		 * - {@link #onAfterExecute}: Hook point for after the `methodName` has been called on the data component.
		 * 
		 * @param {String} methodName The name of the method to execute (i.e. the method under test).
		 * @param {Mixed...} extraArgs Any extra arguments to be passed to the method under test. These arguments will
		 *   be passed to the method under test before the `options` object that this method passes.
		 *   Ex: `persistenceVerifier.execute( 'loadPage', 1 );`
		 * @return {data.persistence.operation.Operation} The Operation object returned by the method under test.
		 *   This will represent either the 'load', 'save', or 'destroy' operation.
		 */
		execute : function( methodName ) {
			// Block multiple executions of the execute() method
			if( this.executed ) throw new Error( "ModelPersistenceVerifier has already executed the model's persistence method. Create a new instance for another persistence method call verification." );
			this.executed = true;
			
			
			var me = this,  // for closures
			    extraArgs = _.toArray( arguments ).slice( 1 ),
			    dataComponentInstance = this.getDataComponent(),        // Model or Collection instance will be returned
			    OperationClass = this.getOperationClass( methodName ),  // OperationClass for verification of callback arguments,
			    eventName = this.getEventName( methodName ),            // The name of the event for the method. A translation might occur here, such as the loadRange() method using the 'load' event
			    scopeObj = {};  // an object for testing the scope that callbacks provided to the method are called in
			
			// Call hook method for subclasses
			this.onBeforeExecute( methodName );
			
			// Assign event handlers
			dataComponentInstance.on( eventName + 'begin', function( model, operation ) {     // ex: 'loadbegin' event
				me.beginEventCount++;
				expect( model ).toBe( dataComponentInstance );
			} );
			dataComponentInstance.on( eventName + 'progress', function( model, operation ) {  // ex: 'loadprogress' event
				me.progressEventCount++;
				expect( model ).toBe( dataComponentInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			dataComponentInstance.on( eventName + 'success', function( model, operation ) {   // ex: 'loadsuccess' event
				me.successEventCount++;
				expect( model ).toBe( dataComponentInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			dataComponentInstance.on( eventName + 'error', function( model, operation ) {     // ex: 'loaderror' event
				me.errorEventCount++;
				expect( model ).toBe( dataComponentInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			dataComponentInstance.on( eventName + 'cancel', function( model, operation ) {    // ex: 'loadcancel' event
				me.cancelEventCount++;
				expect( model ).toBe( dataComponentInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			dataComponentInstance.on( eventName, function( model, operation ) {               // ex: 'load' event
				me.completeEventCount++;
				expect( model ).toBe( dataComponentInstance );
				expect( operation instanceof OperationClass ).toBe( true );
			} );
			
			
			// Create the options object for the persistence method
			var options = {
				progress : function( dataComponent, operation ) {
					me.progressCbCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
					expect( this ).toBe( scopeObj );  // make sure `scope` was set
				},
				success : function( dataComponent, operation ) {
					me.successCbCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
					expect( this ).toBe( scopeObj );  // make sure `scope` was set
				},
				error : function( dataComponent, operation ) {
					me.errorCbCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
					expect( this ).toBe( scopeObj );  // make sure `scope` was set
				},
				cancel : function( dataComponent, operation ) {
					me.cancelCbCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
					expect( this ).toBe( scopeObj );  // make sure `scope` was set
				},
				complete : function( dataComponent, operation ) {
					me.completeCbCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
					expect( this ).toBe( scopeObj );  // make sure `scope` was set
				},
				scope : scopeObj
			};
	
			// Determine the arguments for the persistence method. 
			// Normally, the `extraArgs` are prepended to the `options` object created by the PersistenceVerifier. However,
			// if the number of "extra args" plus the 'options' object created by the PersistenceVerifier would exceed 
			// the number of arguments that the method accepts, then the last 'extraArg' provided must be an 'options' object 
			// itself. In this case, combine it with the 'options' object that the PersistenceVerifier has already created.
			var args = extraArgs.concat( options );
			if( args.length > dataComponentInstance[ methodName ].length ) {
				_.assign( args[ args.length - 2 ], args[ args.length - 1 ] );
				args.length = args.length - 1;  // remove the last element, which is an extra argument in this case
			}
			
			// Finally, call the persistence method
			var operation = dataComponentInstance[ methodName ].apply( dataComponentInstance, args );
			
			
			// -----------------------------------
			
			
			// Verify that the method returned an Operation object
			expect( operation instanceof Operation ).toBe( true );
			
			// Attach promise handlers
			operation
				.progress( function( dataComponent, operation ) {
					me.progressCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} )
				.done( function( dataComponent, operation ) {
					me.doneCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} )
				.fail( function( dataComponent, operation ) {
					me.failCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} )
				.cancel( function( dataComponent, operation ) {
					me.cancelCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} )
				.always( function( dataComponent, operation ) {
					me.alwaysCallCount++;
					expect( dataComponent ).toBe( dataComponentInstance );
					expect( operation instanceof OperationClass ).toBe( true );
				} );
			
			
			// Check that appropriate "begin" was fired (such as 'loadbegin'), but not the "complete" event 
			// yet (such as 'load'). Also, check that the Model is in the appropriate state (such as 'loading', or 'saving').
			expect( this.beginEventCount ).toBe( 1 );
			expect( this.completeEventCount ).toBe( 0 );
			
			this.onAfterExecute( methodName );
			
			return operation;
		},
		
		
		/**
		 * Hook method which must be implemented in subclasses to test the state of the data component before
		 * {@link #execute} has called the method under test.
		 * 
		 * @abstract
		 * @protected
		 * @param {String} methodName The name of the method under test.
		 */
		onBeforeExecute : Class.abstractMethod,
		
		
		/**
		 * Hook method which must be implemented in subclasses to test the state of the data component after
		 * {@link #execute} has called the method under test. 
		 * 
		 * Note that this will most often be called before the persistence operation has been completed, unless
		 * the proxy being used is a synchronous proxy like the {@link data.persistence.proxy.Memory MemoryProxy}. 
		 * To check the state of the data component after the persistence operation has completed, override
		 * {@link #onVerify}.
		 * 
		 * @abstract
		 * @protected
		 * @param {String} methodName The name of the method under test.
		 */
		onAfterExecute : Class.abstractMethod,
		
		
		/**
		 * Verifies the outcome of the fixture's execution of the test {@link #method}.
		 * 
		 * This should be called after the completion of the persistence operation, whether the persistence operation
		 * was successful, has errored, or has been canceled.
		 * 
		 * This is a template method, which calls the following hook methods for subclasses:
		 * 
		 * - {@link #onVerify}: Hook point for subclasses to use to verify any post-operation state.
		 * 
		 * @param {String} expectedOutcome The expected outcome after the persistence operation ('load', 'save', or 'destroy')
		 * has been completed. Must be one of: 'success', 'error', or 'cancel'.
		 * @param {Object} [options] An object which may have the following properties:
		 * @param {Number} [options.expectedProgressCount=0] The number of expected "progress" events.
		 */
		verify : function( expectedOutcome, options ) {
			if( !_.contains( [ 'success', 'error', 'cancel' ], expectedOutcome ) ) 
				throw new Error( "`expectedOutcome` arg must be one of: 'success', 'error', 'cancel'" );
			
			options = options || {};
			var expectedProgressCount = options.expectedProgressCount || 0;
			
			// Call hook method for subclasses to check the state of the model during verification
			this.onVerify( expectedOutcome );
			
			// Make sure the appropriate events/callbacks/handlers executed
			expect( this.beginEventCount ).toBe( 1 );    // make sure it wasn't fired again
			expect( this.progressEventCount ).toBe( expectedProgressCount );                 // ex: 'loadprogress' event
			expect( this.successEventCount ).toBe( expectedOutcome === 'success' ? 1 : 0 );  // ex: 'loadsuccess' event
			expect( this.errorEventCount ).toBe( expectedOutcome === 'error' ? 1 : 0 );      // ex: 'loaderror' event
			expect( this.cancelEventCount ).toBe( expectedOutcome === 'cancel' ? 1 : 0 );    // ex: 'loadcancel' event
			expect( this.completeEventCount ).toBe( 1 );                                     // ex: 'load' event, which really means "load complete"
			
			expect( this.progressCbCallCount ).toBe( expectedProgressCount );
			expect( this.successCbCallCount ).toBe( expectedOutcome === 'success' ? 1 : 0 );
			expect( this.errorCbCallCount ).toBe( expectedOutcome === 'error' ? 1 : 0 );
			expect( this.cancelCbCallCount ).toBe( expectedOutcome === 'cancel' ? 1 : 0 );
			expect( this.completeCbCallCount ).toBe( 1 );
			
			expect( this.progressCallCount ).toBe( expectedProgressCount );
			expect( this.doneCallCount ).toBe( expectedOutcome === 'success' ? 1 : 0 );
			expect( this.failCallCount ).toBe( expectedOutcome === 'error' ? 1 : 0 );
			expect( this.cancelCallCount ).toBe( expectedOutcome === 'cancel' ? 1 : 0 );
			expect( this.alwaysCallCount ).toBe( 1 );
		},
		
		
		/**
		 * Hook method which must be implemented in subclasses to test the state of the data component during
		 * the call to {@link #verify}, to check the state of the data component after its persistence method
		 * has completed its operation.
		 * 
		 * @abstract
		 * @protected
		 * @param {String} expectedOutcome The expected outcome after the persistence operation ('load', 'save', or 'destroy')
		 * has been completed. Will be one of: 'success', 'error', or 'cancel'.
		 */
		onVerify : Class.abstractMethod
	
	} );
	
	
	return PersistenceVerifier;
	
} );