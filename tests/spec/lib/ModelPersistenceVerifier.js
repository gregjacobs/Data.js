/*global define, expect */
define( [
	'lodash',
	
	'data/Model',
	'spec/lib/PersistenceVerifier',
	
	'data/persistence/operation/Load',
	'data/persistence/operation/Save',
	'data/persistence/operation/Destroy'
], function( _, Model, PersistenceVerifier, LoadOperation, SaveOperation, DestroyOperation ) {
	
	/**
	 * @class spec.lib.ModelPersistenceVerifier
	 * @extends spec.lib.PersistenceVerifier
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
	 *                 manualProxy.resolveRead( 0, { id: 1, attr: "abc" } );  // Resolve the "read" request that the load operation performed (the first 'read' request), and 
	 *                 modelPersistenceVerifier.verify( 'success' );  // verify that the appropriate events/callbacks/handlers were called - executes Jasmine expect() statements
	 *             } );
	 *             
	 *         } );
	 *         
	 *     } );
	 */
	var ModelPersistenceVerifier = PersistenceVerifier.extend( {
		
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
			this._super( arguments );
			
			// Check required configs
			if( !this.model || !( this.model instanceof Model ) ) throw new Error( "`model` cfg required, and must be a data.Model instance" );
		},
		
		
		/**
		 * Implementation of abstract method from superclass, which returns the {@link #model} as the data component
		 * under test.
		 * 
		 * @protected
		 * @return {data.Model} The Model to use for the test.
		 */
		getDataComponent : function() {
			return this.model;
		},
		
		
		/**
		 * Implementation of abstract method from superclass, which returns the appropriate 
		 * {@link data.persistence.operation.Operation} class which is expected, based on the input `methodName`.
		 * 
		 * @protected
		 * @return {data.Model} The Model to use for the test.
		 */
		getOperationClass : function( methodName ) {
			switch( methodName ) {
				case 'load'    : return LoadOperation;
				case 'save'    : return SaveOperation;
				case 'destroy' : return DestroyOperation;
				default        : throw new Error( "unhandled case" );
			}
		},
		
		
		/**
		 * Implementation of abstract hook method, used to check the argument provided to {@link #execute}, and
		 * that the initial state of the {@link #model} is correct.
		 * 
		 * @protected
		 * @param {String} methodName The name of the method that will be called on the {@link #model}. 
		 */
		onBeforeExecute : function( methodName ) {
			var methodNames = [ 'load', 'save', 'destroy' ];
			if( !_.contains( methodNames, methodName ) )
				throw new Error( "`methodName` arg must be one of: '" + methodNames.join( "', '" ) + "'" );
			
			// Check the initial state of the model before the persistence method is called
			var model = this.model;
			expect( model.isLoading() ).toBe( false );
			expect( model.isSaving() ).toBe( false );
			expect( model.isDestroying() ).toBe( false );
			expect( model.isDestroyed() ).toBe( false );
		},
		
		
		/**
		 * Implementation of abstract hook method, used to check that the state of the {@link #model} is correct
		 * after calling the method ('load', 'save', or 'destroy').
		 * 
		 * @protected
		 * @param {String} methodName The name of the method that will be called on the {@link #model}. 
		 */
		onAfterExecute : function( methodName ) {
			var model = this.model;
			
			expect( model.isLoading() ).toBe( methodName === 'load' ? true : false );
			expect( model.isSaving() ).toBe( methodName === 'save' ? true : false );
			expect( model.isDestroying() ).toBe( methodName === 'destroy' ? true : false );
			expect( model.isDestroyed() ).toBe( false );
		},
		
		
		/**
		 * Implementation of abstract hook method, used to check that the state of the {@link #model} is correct
		 * after the persistence operation has completed.
		 * 
		 * @protected
		 * @param {String} expectedOutcome The expected outcome after the persistence operation ('load', 'save', or 'destroy')
		 * has been completed. Will be one of: 'success', 'error', or 'cancel'.
		 */
		onVerify : function( expectedOutcome ) {
			var model = this.model;
			expect( model.isLoading() ).toBe( false );
			expect( model.isSaving() ).toBe( false );
			expect( model.isDestroying() ).toBe( false );
		}
	
	} );
	
	
	return ModelPersistenceVerifier;
	
} );