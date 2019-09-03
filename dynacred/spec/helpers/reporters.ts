import TSConsoleReporter from "jasmine-ts-console-reporter";

jasmine.getEnv().clearReporters(); // Clear default console reporter
jasmine.getEnv().addReporter(new TSConsoleReporter());
