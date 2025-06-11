
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Send, FileText, LinkIcon, SearchCode, Cpu } from 'lucide-react'; // Added Cpu icon

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea'; // Added Textarea
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
// Alert removed as Etherscan is now live, and techQuery will have its own input.

// Updated Zod schema for the form
const formSchema = z.object({
  inputType: z.enum(['url', 'file', 'address', 'techQuery']).default('url'),
  contractUrl: z.string().optional(),
  contractFile: (typeof window === 'undefined' ? z.any() : z.instanceof(FileList)).optional(),
  contractAddress: z.string().optional(),
  techQueryCode: z.string().optional(), // For the new textarea
}).superRefine((data, ctx) => {
  if (data.inputType === 'url') {
    if (!data.contractUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please enter a contract URL.', path: ['contractUrl'] });
    } else if (!z.string().url({ message: "Invalid URL format." }).safeParse(data.contractUrl).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please enter a valid URL (e.g., https://example.com/contract.sol).', path: ['contractUrl'] });
    }
  } else if (data.inputType === 'file') {
    if (!data.contractFile || data.contractFile.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please upload a .sol or .vy file.', path: ['contractFile'] });
    } else if (data.contractFile && data.contractFile.length > 0) {
        const fileName = data.contractFile[0].name;
        if (!fileName.endsWith('.sol') && !fileName.endsWith('.vy')) {
             ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid file type. Only .sol or .vy files are accepted.', path: ['contractFile'] });
        }
    }
  } else if (data.inputType === 'address') {
    if (!data.contractAddress || data.contractAddress.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please enter a contract address.', path: ['contractAddress'] });
    } else if (!/^(0x)?[0-9a-fA-F]{40}$/.test(data.contractAddress)) {
       ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid contract address format. (e.g., 0x...).', path: ['contractAddress'] });
    }
  } else if (data.inputType === 'techQuery') {
    if (!data.techQueryCode || data.techQueryCode.trim().length < 20) { // Basic length check
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Please paste sufficient smart contract code (min 20 characters).', path: ['techQueryCode'] });
    }
  }
});

export type CodeSubmissionFormValues = z.infer<typeof formSchema>;

type CodeSubmissionFormProps = {
  onSubmit: (values: CodeSubmissionFormValues) => void;
  isLoading: boolean;
};

export function CodeSubmissionForm({ onSubmit, isLoading }: CodeSubmissionFormProps) {
  const form = useForm<CodeSubmissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      inputType: 'url',
      contractUrl: '',
      contractFile: undefined,
      contractAddress: '',
      techQueryCode: '',
    },
  });

  const selectedInputType = form.watch('inputType');

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Submit Smart Contract for Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="inputType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Analysis Type / Input Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      disabled={isLoading}
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="url" id="url" />
                        </FormControl>
                        <FormLabel htmlFor="url" className="font-normal flex items-center">
                          <LinkIcon className="mr-2 h-4 w-4 text-muted-foreground" /> URL (Vulnerability Audit)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="file" id="file" />
                        </FormControl>
                        <FormLabel htmlFor="file" className="font-normal flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-muted-foreground" /> File Upload (Vulnerability Audit)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="address" id="address" />
                        </FormControl>
                        <FormLabel htmlFor="address" className="font-normal flex items-center">
                           <SearchCode className="mr-2 h-4 w-4 text-muted-foreground" /> Contract Address (Vulnerability Audit)
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="techQuery" id="techQuery" />
                        </FormControl>
                        <FormLabel htmlFor="techQuery" className="font-normal flex items-center">
                           <Cpu className="mr-2 h-4 w-4 text-muted-foreground" /> Technology Breakdown (Code Paste)
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedInputType === 'url' && (
              <FormField
                control={form.control}
                name="contractUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Code URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/path/to/contract.sol"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the public URL of the smart contract code (e.g., GitHub raw URL) for vulnerability audit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedInputType === 'file' && (
              <FormField
                control={form.control}
                name="contractFile"
                render={({ field: { onChange, value, ...restField } }) => (
                  <FormItem>
                    <FormLabel>Upload .sol or .vy File</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".sol,.vy"
                        onChange={(e) => onChange(e.target.files)}
                        {...restField}
                        disabled={isLoading}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                      />
                    </FormControl>
                    <FormDescription>
                      Select a Solidity (.sol) or Vyper (.vy) file from your computer for vulnerability audit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedInputType === 'address' && (
              <FormField
                control={form.control}
                name="contractAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Address (Ethereum Mainnet)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="0x123abc..."
                        {...field}
                        value={field.value ?? ""}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the Ethereum mainnet address. Source code will be fetched from Etherscan for vulnerability audit.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {selectedInputType === 'techQuery' && (
              <FormField
                control={form.control}
                name="techQueryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paste Smart Contract Code</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your smart contract code here..."
                        className="min-h-[200px] font-code text-sm"
                        {...field}
                        value={field.value ?? ""}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormDescription>
                      Paste the full smart contract code for analysis of technologies used.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {selectedInputType === 'techQuery' ? 'Analyze Technologies' : 'Analyze Contract for Vulnerabilities'}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
